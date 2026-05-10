"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, RefreshCw, AlertTriangle } from "lucide-react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { base } from "wagmi/chains";
import { Token, SlippageSettings } from "@/types";
import { BASE_TOKENS } from "@/lib/tokens";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { TokenInput } from "./TokenInput";
import { TokenSelector } from "./TokenSelector";
import { SlippagePanel } from "./SlippagePanel";
import { SwapDetails } from "./SwapDetails";
import { isValidAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SelectorTarget = "input" | "output" | null;

export function SwapCard() {
  const { address, isConnected, chain } = useAccount();

  // Tokens
  const [inputToken, setInputToken] = useState<Token>(BASE_TOKENS[0]);
  const [outputToken, setOutputToken] = useState<Token>(BASE_TOKENS[1]);
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);

  // Amounts
  const [inputAmount, setInputAmount] = useState("");

  // Settings
  const [slippage, setSlippage] = useState<SlippageSettings>({
    value: 0.5,
    auto: true,
  });

  // Price data
  const { data: prices = {}, isLoading: pricesLoading, refetch: refetchPrices } = useTokenPrices(BASE_TOKENS);

  // Quote
  const {
    data: quote,
    isLoading: quoteLoading,
    isFetching: quoteFetching,
  } = useSwapQuote(
    inputToken,
    outputToken,
    inputAmount,
    slippage.value,
    prices
  );

  // Balances
  const { balance: inputBalance } = useTokenBalance(inputToken, address);
  const { balance: outputBalance } = useTokenBalance(outputToken, address);

  // Swap transaction (demo — in production use aggregator calldata)
  const { sendTransaction, data: txHash, isPending: txPending } = useSendTransaction();
  const { isLoading: txConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isWrongNetwork = isConnected && chain?.id !== base.id;
  const hasAmount = isValidAmount(inputAmount);
  const hasQuote = !!quote;
  const isSwapping = txPending || txConfirming;

  // Swap token positions
  const handleFlip = useCallback(() => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(quote?.outputAmount ?? "");
  }, [inputToken, outputToken, quote]);

  // Handle max
  const handleMax = () => {
    if (inputBalance) {
      setInputAmount(inputBalance);
    }
  };

  // Handle swap (demo)
  const handleSwap = () => {
    if (!address || !hasQuote) return;
    // In production: call aggregator API for calldata, then sendTransaction
    // Here we demonstrate the flow
    sendTransaction({
      to: address,
      value: BigInt(0),
    });
  };

  const getButtonState = () => {
    if (!isConnected) return { label: "Connect Wallet", disabled: true, variant: "ghost" };
    if (isWrongNetwork) return { label: "Switch to Base", disabled: false, variant: "warning" };
    if (!inputToken || !outputToken) return { label: "Select Tokens", disabled: true, variant: "ghost" };
    if (!hasAmount) return { label: "Enter Amount", disabled: true, variant: "ghost" };
    if (quoteLoading || quoteFetching) return { label: "Fetching Quote...", disabled: true, variant: "ghost" };
    if (!hasQuote) return { label: "Insufficient Liquidity", disabled: true, variant: "ghost" };
    if (isSwapping) return { label: txConfirming ? "Confirming..." : "Swapping...", disabled: true, variant: "loading" };
    if (txSuccess) return { label: "Swap Complete ✓", disabled: false, variant: "success" };
    const inputNum = parseFloat(inputAmount);
    const balNum = parseFloat(inputBalance);
    if (inputNum > balNum && address) return { label: `Insufficient ${inputToken.symbol}`, disabled: true, variant: "ghost" };
    return { label: "Swap", disabled: false, variant: "primary" };
  };

  const btn = getButtonState();

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-glow-cyan opacity-30 blur-2xl -z-10 scale-95" />

          <div className="relative bg-base-card border border-base-border rounded-3xl overflow-hidden shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="font-display font-bold text-white text-xl">Swap</h2>
                <p className="text-xs font-mono text-gray-600 mt-0.5">Base Network</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchPrices()}
                  className="p-2 rounded-lg hover:bg-base-muted text-gray-500 hover:text-gray-300 transition-colors"
                  title="Refresh prices"
                >
                  <RefreshCw
                    size={14}
                    className={cn(pricesLoading && "animate-spin")}
                  />
                </button>
                <SlippagePanel settings={slippage} onChange={setSlippage} />
              </div>
            </div>

            {/* Token inputs */}
            <div className="px-4 pb-4 space-y-1">
              <TokenInput
                label="You pay"
                token={inputToken}
                amount={inputAmount}
                onAmountChange={setInputAmount}
                onTokenSelect={() => setSelectorTarget("input")}
                balance={address ? inputBalance : undefined}
                onMaxClick={address ? handleMax : undefined}
                prices={prices}
              />

              {/* Flip button */}
              <div className="relative flex justify-center z-10">
                <button
                  onClick={handleFlip}
                  className="group absolute -top-1 flex items-center justify-center w-8 h-8 rounded-xl bg-base-card border border-base-border hover:border-accent-cyan/30 hover:bg-base-surface text-gray-500 hover:text-accent-cyan transition-all"
                >
                  <ArrowDownUp
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
                </button>
              </div>

              <TokenInput
                label="You receive"
                token={outputToken}
                amount={quote?.outputAmount ?? ""}
                onTokenSelect={() => setSelectorTarget("output")}
                balance={address ? outputBalance : undefined}
                prices={prices}
                readonly
                isLoading={quoteLoading && hasAmount}
              />
            </div>

            {/* Quote details */}
            <AnimatePresence>
              {quote && inputToken && outputToken && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-3"
                >
                  <SwapDetails
                    inputToken={inputToken}
                    outputToken={outputToken}
                    priceImpact={quote.priceImpact}
                    minimumReceived={quote.minimumReceived}
                    fee={quote.fee}
                    gasEstimate={quote.gasEstimate}
                    slippage={slippage.value}
                    prices={prices}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* High price impact warning */}
            <AnimatePresence>
              {quote && quote.priceImpact > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mx-4 mb-3 flex items-start gap-2 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-mono"
                >
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>
                    High price impact ({quote.priceImpact.toFixed(2)}%). This swap may be unfavorable.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Swap button */}
            <div className="px-4 pb-5">
              <button
                onClick={handleSwap}
                disabled={btn.disabled}
                className={cn(
                  "w-full py-4 rounded-2xl font-display font-semibold text-base transition-all duration-200",
                  btn.variant === "primary" &&
                    "bg-accent-cyan text-black hover:bg-accent-cyan/90 hover:shadow-glow-cyan active:scale-[0.98]",
                  btn.variant === "success" &&
                    "bg-accent-green text-black",
                  btn.variant === "warning" &&
                    "bg-accent-orange/20 border border-accent-orange/50 text-accent-orange hover:bg-accent-orange/30",
                  btn.variant === "loading" &&
                    "bg-base-muted text-gray-400 cursor-not-allowed",
                  btn.variant === "ghost" &&
                    "bg-base-surface border border-base-border text-gray-500 cursor-not-allowed"
                )}
              >
                {btn.variant === "loading" && (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {btn.label}
                  </span>
                )}
                {btn.variant !== "loading" && btn.label}
              </button>
            </div>

            {/* Powered by */}
            <div className="border-t border-base-border px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-700">
                Powered by{" "}
                <span className="text-gray-500">Surf API</span>
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                <span className="text-xs font-mono text-gray-700">Live prices</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Token selectors */}
      <TokenSelector
        isOpen={selectorTarget === "input"}
        onClose={() => setSelectorTarget(null)}
        onSelect={setInputToken}
        excludeToken={outputToken}
        prices={prices}
      />
      <TokenSelector
        isOpen={selectorTarget === "output"}
        onClose={() => setSelectorTarget(null)}
        onSelect={setOutputToken}
        excludeToken={inputToken}
        prices={prices}
      />
    </>
  );
}
