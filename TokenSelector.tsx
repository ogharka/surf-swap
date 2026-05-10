"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { Token, TokenPrice } from "@/types";
import { BASE_TOKENS } from "@/lib/tokens";
import { TokenLogo } from "./TokenLogo";
import { formatUSD, formatPercent } from "@/lib/surf";
import { cn } from "@/lib/utils";

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
  prices: Record<string, TokenPrice>;
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  excludeToken,
  prices,
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return BASE_TOKENS.filter((t) => {
      if (excludeToken && t.address === excludeToken.address) return false;
      if (!query) return true;
      return (
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.address.toLowerCase().includes(query)
      );
    });
  }, [search, excludeToken]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearch("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="mx-4 bg-base-card border border-base-border rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-base-border">
                <h3 className="font-display font-semibold text-white text-lg">
                  Select Token
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-base-muted text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 pb-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by name or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-base-surface border border-base-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-accent-cyan/50 transition-colors"
                  />
                </div>
              </div>

              {/* Common tokens */}
              {!search && (
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500 font-mono mb-2">
                    POPULAR
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BASE_TOKENS.slice(0, 4).map((token) => (
                      <button
                        key={token.address}
                        onClick={() => handleSelect(token)}
                        disabled={excludeToken?.address === token.address}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-mono transition-all",
                          excludeToken?.address === token.address
                            ? "border-base-border text-gray-600 cursor-not-allowed"
                            : "border-base-border hover:border-accent-cyan/50 hover:bg-base-muted text-gray-300"
                        )}
                      >
                        <TokenLogo token={token} size="sm" />
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Token list */}
              <div className="mt-2 max-h-72 overflow-y-auto px-2 pb-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 font-mono text-sm">
                    No tokens found
                  </div>
                ) : (
                  filtered.map((token) => {
                    const price = token.coingeckoId
                      ? prices[token.coingeckoId]
                      : undefined;
                    const change = price?.usd_24h_change;
                    const isPositive = (change ?? 0) >= 0;

                    return (
                      <button
                        key={token.address}
                        onClick={() => handleSelect(token)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-base-muted transition-colors group"
                      >
                        <TokenLogo token={token} size="md" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-white text-sm">
                              {token.symbol}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{token.name}</p>
                        </div>
                        <div className="text-right">
                          {price ? (
                            <>
                              <p className="text-sm font-mono text-white">
                                {formatUSD(price.usd)}
                              </p>
                              <p
                                className={cn(
                                  "text-xs font-mono flex items-center justify-end gap-0.5",
                                  isPositive
                                    ? "text-accent-green"
                                    : "text-accent-red"
                                )}
                              >
                                {isPositive ? (
                                  <TrendingUp size={10} />
                                ) : (
                                  <TrendingDown size={10} />
                                )}
                                {change !== undefined
                                  ? formatPercent(change)
                                  : "—"}
                              </p>
                            </>
                          ) : (
                            <div className="w-16 h-4 bg-base-muted rounded animate-pulse" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
