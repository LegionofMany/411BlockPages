"use client";
import React, { useEffect, useState } from 'react';
import DonationQR from '../DonationQR';

type WalletDetailsProps = {
  address: string | null;
  ensName?: string | null;
  udDomain?: string | null;
  onDisconnect?: () => void;
};

export default function WalletDetails({ address, ensName, udDomain, onDisconnect }: WalletDetailsProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (!address) {
    return (
      <div className="rounded-3xl border border-emerald-500/40 bg-black/80 p-4 text-amber-100 text-sm">
        Connect your wallet on the main navigation to see details here.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-black/80 p-5 text-amber-50">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Connected wallet
          </p>
          {ensName || udDomain ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {ensName && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-emerald-100">
                  {ensName}
                </span>
              )}
              {udDomain && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-amber-100">
                  {udDomain}
                </span>
              )}
            </div>
          ) : null}
          <div className="mt-1 font-mono text-[11px] break-all text-amber-100/90">{address}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow hover:bg-emerald-400 transition-colors"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onDisconnect && (
            <button
              type="button"
              onClick={onDisconnect}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 text-xs text-emerald-100/80">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-emerald-200">Risk rating</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Green · placeholder
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/70">
            This risk badge will be powered by the wallet risk engine in a later phase.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/50 bg-black/60 p-2">
            <DonationQR address={address} />
          </div>
        </div>
      </div>
    </section>
  );
}
