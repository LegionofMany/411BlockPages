"use client";

import React from "react";
import { useWallet } from './WalletProvider';

// Connect button wired to the client-only `WalletProvider`. Opening the
// Reown modal is performed via the provider so no WalletConnect code runs
// during SSR.
export function ConnectWalletButton() {
  let open = () => {};
  try {
    const ctx = useWallet();
    open = ctx.open;
  } catch (_) {
    // If the hook is used outside provider, fallback to no-op.
  }

  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
    >
      Connect wallet
    </button>
  );
}
