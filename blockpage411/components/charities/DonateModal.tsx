"use client";

import React, { useState, useEffect, useRef } from "react";
import { explorerUrlFor } from "../../lib/explorer";

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
  // element to restore focus to when modal closes
  restoreFocusTo?: HTMLElement | null;
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
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // focus first focusable element
    const focusable = modal
      ? Array.from(modal.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex='-1'])")).filter(
          (el) => el.offsetParent !== null
        )
      : [];
    if (focusable.length) focusable[0].focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // simple focus trap
        if (!modal) return;
        const nodes = focusable;
        if (nodes.length === 0) return;
        const idx = nodes.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey) {
          if (idx === 0) {
            e.preventDefault();
            nodes[nodes.length - 1].focus();
          }
        } else {
          if (idx === nodes.length - 1) {
            e.preventDefault();
            nodes[0].focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // restore focus to saved opener if present, otherwise previously focused element
      try {
        const saved = (window as any).__bp_restore_focus as HTMLElement | null | undefined;
        const target = saved ?? previouslyFocused;
        if (target && typeof target.focus === 'function') target.focus();
      } catch {}
      try {
        // cleanup global
        if ((window as any).__bp_restore_focus) delete (window as any).__bp_restore_focus;
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const activeWallet = wallets.find((w) => w.chain === selectedChain) || wallets[0];
  const qrValue = activeWallet ? activeWallet.address : "";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 px-4 py-6" onClick={onClose}>
      <div className="min-h-full w-full flex items-start justify-center sm:items-center">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-heading"
          className="relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-700/40 via-black to-black/95 p-5 sm:p-6 shadow-[0_0_40px_rgba(16,185,129,0.6)] max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200 hover:bg-black"
        >
          Close
        </button>
        <h2 id="donate-heading" className="text-lg font-semibold tracking-wide text-emerald-100">
          Donate to <span className="text-amber-300">{charityName}</span>
        </h2>
        <p className="mt-1 text-xs text-emerald-100/80">
          100% peer-to-peer — you send directly to the charity&apos;s wallet.
        </p>

        <div className="mt-4">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Choose blockchain
          </label>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Choose blockchain"
          >
            {chains.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selectedChain === c.id}
                tabIndex={selectedChain === c.id ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    const next = chains[(idx + 1) % chains.length];
                    setSelectedChain(next.id);
                    e.preventDefault();
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    const prev = chains[(idx - 1 + chains.length) % chains.length];
                    setSelectedChain(prev.id);
                    e.preventDefault();
                  } else if (e.key === ' ' || e.key === 'Enter') {
                    setSelectedChain(c.id);
                    e.preventDefault();
                  }
                }}
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
              <div className="mt-1 flex flex-col gap-1">
              <div className="flex items-center gap-2 rounded-2xl bg-black/70 px-3 py-2 text-xs text-emerald-100 border border-emerald-500/40">
                <span className="flex-1 break-all font-mono text-[11px]">{activeWallet.address}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(activeWallet.address);
                        setLiveMessage('Address copied to clipboard');
                        setTimeout(() => setLiveMessage(null), 1500);
                      } catch {
                        setLiveMessage('Copy failed');
                        setTimeout(() => setLiveMessage(null), 1500);
                      }
                    }}
                    className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-emerald-400"
                  >
                    Copy
                  </button>
                  {liveMessage ? <span className="text-[11px] text-emerald-300">{liveMessage}</span> : null}
                </div>
              </div>
              {(() => {
                const explorer = explorerUrlFor(activeWallet.address, activeWallet.chain);
                return explorer ? (
                  <a
                    href={explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="self-start text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90 underline-offset-2 hover:text-emerald-100 hover:underline"
                  >
                    View on explorer
                  </a>
                ) : null;
              })()}
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
              id="donate-amount"
              type="number"
              min={0}
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-2xl border border-emerald-500/40 bg-black/70 px-3 py-2 text-xs text-emerald-100 placeholder:text-emerald-500/60 focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {qrValue && (
            <div className="rounded-2xl border border-emerald-500/40 bg-black/80 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <p className="text-[11px] text-emerald-100/80">Scan this address with your wallet app to donate.</p>
              </div>
              <p className="mt-1 break-all font-mono text-[10px] text-emerald-300/90">{qrValue}</p>
            </div>
          )}
          <p className="text-[11px] text-emerald-100/75 text-center">
            Send your donation from your own wallet app using the address or QR above.
            <br />
            Donations go directly to the charity&apos;s wallet. Blockpage411 does not custody funds or provide refunds.
          </p>
        </div>
        {/* live region for screen readers */}
        <div aria-live="polite" className="sr-only">{liveMessage}</div>
        </div>
      </div>
    </div>
  );
}
