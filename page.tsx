"use client";

import { motion } from "framer-motion";
import { SwapCard } from "@/components/SwapCard";
import { WalletButton } from "@/components/WalletButton";
import { PriceTicker } from "@/components/PriceTicker";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { BASE_TOKENS } from "@/lib/tokens";

export default function Home() {
  const { data: prices = {} } = useTokenPrices(BASE_TOKENS);

  return (
    <div className="min-h-screen bg-base-bg text-white overflow-x-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-accent-cyan/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent-purple/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-base-border bg-base-bg/80 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-lg bg-accent-cyan/20 animate-pulse-slow" />
              <div className="absolute inset-0.5 rounded-md bg-accent-cyan flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1L13 4V10L7 13L1 10V4L7 1Z"
                    stroke="black"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <circle cx="7" cy="7" r="2" fill="black" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-white text-lg leading-none">
                BaseSwap
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1 h-1 rounded-full bg-blue-500" />
                <span className="text-[10px] font-mono text-gray-600">Base Network</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["Swap", "Pools", "Analytics"].map((item) => (
              <button
                key={item}
                className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-colors ${
                  item === "Swap"
                    ? "text-white bg-base-surface border border-base-border"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <WalletButton />
        </div>
      </header>

      {/* Price ticker */}
      <PriceTicker tokens={BASE_TOKENS} prices={prices} />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-3 tracking-tight">
            Swap on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-green">
              Base
            </span>
          </h1>
          <p className="font-mono text-sm text-gray-500 max-w-xs mx-auto">
            Fast, low-fee token swaps on Base L2. Powered by real-time market data.
          </p>
        </motion.div>

        <SwapCard />

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 flex items-center gap-6 sm:gap-10"
        >
          {[
            { label: "24h Volume", value: "$2.4B" },
            { label: "Liquidity", value: "$680M" },
            { label: "Avg Gas", value: "~$0.05" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display font-bold text-white text-lg">
                {stat.value}
              </p>
              <p className="font-mono text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-base-border py-4">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-xs text-gray-700">
            © 2025 BaseSwap. Not financial advice.
          </p>
          <div className="flex items-center gap-4">
            {["Docs", "Terms", "Privacy"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-mono text-xs text-gray-700 hover:text-gray-400 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
