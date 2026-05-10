"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from "lucide-react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
} from "wagmi";
import { base } from "wagmi/chains";
import { truncateAddress, formatBalance } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const isWrongNetwork = isConnected && chain?.id !== base.id;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowConnect(!showConnect)}
          className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-mono text-sm font-medium hover:bg-accent-cyan/20 hover:border-accent-cyan/50 transition-all"
        >
          <Wallet size={15} />
          <span>Connect</span>
          <ChevronDown size={13} className={cn("transition-transform", showConnect && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showConnect && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowConnect(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-20 w-56 bg-base-card border border-base-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-2">
                  <p className="text-xs font-mono text-gray-500 px-2 py-1.5">WALLETS</p>
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      onClick={() => {
                        connect({ connector });
                        setShowConnect(false);
                      }}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-muted text-white text-sm font-mono transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-base-surface border border-base-border flex items-center justify-center">
                        <Wallet size={13} className="text-gray-400" />
                      </div>
                      <span>{connector.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red font-mono text-sm font-medium hover:bg-accent-red/20 transition-all animate-pulse"
      >
        <span>⚠</span>
        <span>Wrong Network</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-surface border border-base-border hover:border-base-muted text-white font-mono text-sm transition-all"
      >
        {/* Status dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
        </span>
        <span className="text-gray-300 text-xs">
          {balance ? formatBalance(balance.value, 18, 3) : "0.000"} ETH
        </span>
        <span className="border-l border-base-border pl-2 text-gray-400">
          {truncateAddress(address!)}
        </span>
        <ChevronDown size={13} className={cn("text-gray-500 transition-transform", showMenu && "rotate-180")} />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-20 w-56 bg-base-card border border-base-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-3 border-b border-base-border">
                <p className="text-xs text-gray-500 font-mono mb-0.5">Connected on</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">B</span>
                  </div>
                  <span className="text-sm font-mono text-white">Base</span>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-muted text-gray-300 hover:text-white text-sm font-mono transition-colors"
                >
                  {copied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy address"}</span>
                </button>
                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-base-muted text-gray-300 hover:text-white text-sm font-mono transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <ExternalLink size={14} />
                  <span>View on Basescan</span>
                </a>
                <button
                  onClick={() => {
                    disconnect();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent-red/10 text-gray-400 hover:text-accent-red text-sm font-mono transition-colors"
                >
                  <LogOut size={14} />
                  <span>Disconnect</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
