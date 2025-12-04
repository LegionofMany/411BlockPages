"use client";
import React from 'react';
import type { NormalizedTransaction } from '../../services/liveFeed/normalizeTransaction';

interface Props {
  tx: NormalizedTransaction;
}

function networkLabel(network: NormalizedTransaction['network']): string {
  if (network === 'ethereum') return 'Ethereum';
  if (network === 'bsc') return 'BNB Chain';
  if (network === 'polygon') return 'Polygon';
  return network;
}

function networkBadgeColor(network: NormalizedTransaction['network']): string {
  switch (network) {
    case 'ethereum':
      return 'bg-indigo-500/80 text-slate-50';
    case 'bsc':
      return 'bg-yellow-400/80 text-slate-900';
    case 'polygon':
      return 'bg-fuchsia-500/80 text-slate-50';
    default:
      return 'bg-slate-500/80 text-slate-50';
  }
}

function valueColor(tx: NormalizedTransaction): string {
  if (tx.isNft) return 'text-purple-300';
  if (tx.isIncoming) return 'text-emerald-300';
  return 'text-red-300';
}

export default function TransactionItem({ tx }: Props) {
  const explorerBase =
    tx.network === 'ethereum'
      ? 'https://etherscan.io/tx/'
      : tx.network === 'bsc'
      ? 'https://bscscan.com/tx/'
      : 'https://polygonscan.com/tx/';

  const hashShort = `${tx.hash.slice(0, 6)}…${tx.hash.slice(-4)}`;
  const fromShort = `${tx.from.slice(0, 6)}…${tx.from.slice(-4)}`;
  const toShort = `${tx.to.slice(0, 6)}…${tx.to.slice(-4)}`;

  const ts = new Date(tx.timestamp);
  const timeStr = ts.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const usdStr = typeof tx.valueUsd === 'number' && tx.valueUsd > 0 ? `$${tx.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '';

  const label = tx.label || (tx.kind === 'large-transfer' ? '🔥 Whale Transfer Detected' : undefined);

  return (
    <div
      className="flex items-stretch gap-3 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/70 via-slate-950/80 to-slate-950/75 px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.75)]"
    >
      <div className={`mt-0.5 inline-flex h-7 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${networkBadgeColor(tx.network)}`}>
        {networkLabel(tx.network)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
            <span className="font-mono truncate max-w-[7rem]">{fromShort}</span>
            <span className="text-slate-500">→</span>
            <span className="font-mono truncate max-w-[7rem]">{toShort}</span>
          </div>
          <div className={`text-xs font-semibold ${valueColor(tx)}`}>
            {tx.valueNative.toFixed(4)} {tx.symbol}
            {usdStr && <span className="ml-1 text-[10px] text-amber-200/80">({usdStr})</span>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <a
              href={`${explorerBase}${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono truncate max-w-[8rem] text-emerald-300 hover:text-emerald-200"
            >
              {hashShort}
            </a>
            {label && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-200 border border-amber-400/40">
                <span>🔥</span>
                <span className="hidden sm:inline">Whale Transfer</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tx.isNft && (
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-semibold text-purple-200 border border-purple-400/60">
                NFT
              </span>
            )}
            <span className="text-[10px] text-slate-500">{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
