"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEvmWallet } from "../../components/EvmWalletProvider";

// Connect button wired to the client-only `WalletProvider`.
// Wallet relays have been removed; this routes users to /login.
export function ConnectWalletButton() {
  const router = useRouter();
  const { isConnected, address } = useEvmWallet();

  const label = isConnected
    ? `Connected${address ? `: ${address.slice(0, 6)}…${address.slice(-4)}` : ''}`
    : "Connect wallet";

  return (
    <button
      type="button"
      onClick={() => {
        try {
          router.push(isConnected ? "/dashboard" : "/login");
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
    >
      {label}
    </button>
  );
}
