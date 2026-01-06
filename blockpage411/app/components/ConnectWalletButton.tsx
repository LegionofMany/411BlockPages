"use client";

import React from "react";

// Minimal stub to keep the layout rendering without RainbowKit.
// This button can later be wired to a custom wagmi-based connect flow.

export function ConnectWalletButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
    >
      Connect wallet
    </button>
  );
}
