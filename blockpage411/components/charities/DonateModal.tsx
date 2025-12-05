"use client";

import React, { useState } from "react";

export interface CharityWallet {
  chain: string;
  address: string;
  label?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  charityName: string;
  wallets: CharityWallet[];
}

const chains = [
  { id: "ethereum", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "solana", label: "Solana" },
  { id: "bitcoin", label: "Bitcoin" },
];

const presets = [5, 10, 25];

export default function DonateModal({ open, onClose, charityName, wallets }: Props) {
  const [selectedChain, setSelectedChain] = useState<string>(wallets[0]?.chain || chains[0].id);
  const [amount, setAmount] = useState<string>("");

  if (!open) return null;

  const activeWallet = wallets.find((w) => w.chain === selectedChain) || wallets[0];
  const qrValue = activeWallet ? activeWallet.address : "";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-700/40 via-black to-black/95 p-6 shadow-[0_0_40px_rgba(16,185,129,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200 hover:bg-black"
        >
          Close
        </button>
        <h2 className="text-lg font-semibold tracking-wide text-emerald-100">
          Donate to <span className="text-amber-300">{charityName}</span>
        </h2>
        <p className="mt-1 text-xs text-emerald-100/80">
          100% peer-to-peer — you send directly to the charity&apos;s wallet.
        </p>

        <div className="mt-4">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Choose blockchain
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {chains.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChain(c.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  selectedChain === c.id
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600 text-black shadow"
                    : "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/20"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {activeWallet && (
          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Donation wallet address
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-2xl bg-black/70 px-3 py-2 text-xs text-emerald-100 border border-emerald-500/40">
              <span className="flex-1 break-all font-mono text-[11px]">{activeWallet.address}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(activeWallet.address)}
                className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-emerald-400"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Quick amounts (USDC)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/20"
              >
                {p} USDC
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-2xl border border-emerald-500/40 bg-black/70 px-3 py-2 text-xs text-emerald-100 placeholder:text-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {qrValue && (
            <div className="rounded-2xl border border-emerald-500/40 bg-black/80 px-4 py-3 text-center">
              <p className="text-[11px] text-emerald-100/80">
                Scan this address with your wallet app to donate.
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-emerald-300/90">{qrValue}</p>
            </div>
          )}
          <p className="text-[11px] text-emerald-100/75 text-center">
            Send your donation from your own wallet app using the address or QR above.
          </p>
        </div>
      </div>
    </div>
  );
}
