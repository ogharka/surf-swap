import { Token, TokenPrice } from "@/types";

const SURF_BASE = "https://api.asksurf.ai/gateway/v1";

function surfHeaders(): HeadersInit {
  const key = process.env.NEXT_PUBLIC_SURF_API_KEY;
  return {
    Accept: "application/json",
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  };
}

// ─── Map Base token symbol → Surf-compatible symbol ──────────────────────────
const SYMBOL_MAP: Record<string, string> = {
  WETH: "ETH",
  USDbC: "USDC",
  cbETH: "ETH",
  wstETH: "ETH",
};

function toSurfSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol] ?? symbol;
}

// ─── Surf ranking item shape ──────────────────────────────────────────────────
interface SurfRankingItem {
  rank: number;
  symbol: string;
  name: string;
  price_usd: number;
  change_24h_pct: number;
  market_cap_usd: number;
  volume_24h_usd: number;
  high_24h: number;
  low_24h: number;
  image?: string;
}

// ─── Fetch token prices via Surf /market/ranking ──────────────────────────────
// GET https://api.asksurf.ai/gateway/v1/market/ranking
export async function fetchTokenPrices(
  tokens: Token[]
): Promise<Record<string, TokenPrice>> {
  try {
    const res = await fetch(
      `${SURF_BASE}/market/ranking?sort_by=market_cap&order=desc&limit=100`,
      { headers: surfHeaders(), next: { revalidate: 30 } }
    );

    if (!res.ok) throw new Error(`Surf ranking ${res.status}`);
    const json = await res.json();
    const items: SurfRankingItem[] = json.data ?? [];

    // Build symbol → data map
    const bySymbol: Record<string, SurfRankingItem> = {};
    for (const item of items) {
      bySymbol[item.symbol.toUpperCase()] = item;
    }

    const prices: Record<string, TokenPrice> = {};
    for (const token of tokens) {
      if (!token.coingeckoId) continue;
      const surf = bySymbol[toSurfSymbol(token.symbol).toUpperCase()];
      if (!surf) continue;
      prices[token.coingeckoId] = {
        usd: surf.price_usd,
        usd_24h_change: surf.change_24h_pct,
        usd_24h_vol: surf.volume_24h_usd,
        usd_market_cap: surf.market_cap_usd,
      };
    }
    return prices;
  } catch (err) {
    console.error("[Surf] fetchTokenPrices error:", err);
    return fetchPricesFallback(tokens);
  }
}

// ─── CoinGecko fallback (no key needed) ──────────────────────────────────────
async function fetchPricesFallback(
  tokens: Token[]
): Promise<Record<string, TokenPrice>> {
  try {
    const ids = tokens.map((t) => t.coingeckoId).filter(Boolean).join(",");
    if (!ids) return {};
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const prices: Record<string, TokenPrice> = {};
    for (const [id, info] of Object.entries(data)) {
      const p = info as Record<string, number>;
      prices[id] = {
        usd: p.usd,
        usd_24h_change: p.usd_24h_change,
        usd_24h_vol: p.usd_24h_vol,
        usd_market_cap: p.usd_market_cap,
      };
    }
    return prices;
  } catch {
    return {};
  }
}

// ─── Price history via Surf /market/price ─────────────────────────────────────
// GET https://api.asksurf.ai/gateway/v1/market/price?symbol=ETH&time_range=1d
export async function fetchPriceHistory(
  symbol: string,
  timeRange: "1d" | "7d" | "30d" = "1d"
): Promise<Array<{ timestamp: number; value: number }>> {
  try {
    const surfSymbol = toSurfSymbol(symbol);
    const res = await fetch(
      `${SURF_BASE}/market/price?symbol=${surfSymbol}&time_range=${timeRange}&currency=usd`,
      { headers: surfHeaders(), next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`Surf price history ${res.status}`);
    const json = await res.json();
    return (json.data ?? []) as Array<{ timestamp: number; value: number }>;
  } catch (err) {
    console.error("[Surf] fetchPriceHistory error:", err);
    return [];
  }
}

// ─── Swap quote (price impact simulation using real Surf prices) ──────────────
// For production: call 0x / 1inch / Li.Fi aggregator with these prices as ref.
export async function fetchSwapQuote(
  inputToken: Token,
  outputToken: Token,
  inputAmount: string,
  slippage: number,
  prices: Record<string, TokenPrice>
): Promise<{
  outputAmount: string;
  priceImpact: number;
  minimumReceived: string;
  fee: string;
  gasEstimate: string;
} | null> {
  try {
    const inputId = inputToken.coingeckoId;
    const outputId = outputToken.coingeckoId;
    if (!inputId || !outputId) return null;

    const inputPrice = prices[inputId]?.usd;
    const outputPrice = prices[outputId]?.usd;
    if (!inputPrice || !outputPrice) return null;

    const inputNum = parseFloat(inputAmount);
    if (isNaN(inputNum) || inputNum <= 0) return null;

    const inputUsd = inputNum * inputPrice;
    const feePct = 0.003; // 0.3% LP fee
    const feeUsd = inputUsd * feePct;
    const outputUsd = inputUsd - feeUsd;
    const outputNum = outputUsd / outputPrice;

    // Price impact scales with trade size vs market cap
    const marketCap = prices[outputId]?.usd_market_cap ?? 1_000_000_000;
    const priceImpact = Math.min((inputUsd / marketCap) * 10000, 15);
    const outputAdjusted = outputNum * (1 - priceImpact / 100);
    const minReceived = outputAdjusted * (1 - slippage / 100);

    const dec = outputToken.decimals > 6 ? 6 : 4;

    return {
      outputAmount: outputAdjusted.toFixed(dec),
      priceImpact: parseFloat(priceImpact.toFixed(4)),
      minimumReceived: minReceived.toFixed(dec),
      fee: feeUsd.toFixed(4),
      gasEstimate: "~$0.05",
    };
  } catch (err) {
    console.error("[Surf] fetchSwapQuote error:", err);
    return null;
  }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
export function formatUSD(value: number): string {
  if (!value || isNaN(value)) return "$0.00";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value < 0.01) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatTokenAmount(
  amount: string | number,
  decimals: number = 4
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return "0";
  if (num < 0.0001) return num.toExponential(4);
  return num.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}
