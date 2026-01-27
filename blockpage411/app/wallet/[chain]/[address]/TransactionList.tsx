"use client";
import React, { useState } from "react";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Transaction } from "../../../../lib/types";

interface TransactionListProps {
  transactions?: Transaction[];
}

function shortenHash(hash?: string | null, front = 6, back = 6) {
  if (!hash) return '';
  if (hash.length <= front + back + 3) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const params = useParams<{ chain?: string; address?: string }>();
  const chain = typeof params?.chain === 'string' ? params.chain : '';

  if (!transactions || transactions.length === 0) return null;

  const handleCopy = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      // ignore copy errors
    }
  };

  return (
    <div className="mt-6 w-full text-left">
      <h3 className="text-cyan-300 font-semibold mb-2">Recent Transactions</h3>
      <ul className="space-y-2">
        {transactions.map((tx, i) => {
          const full = tx.txid || tx.hash || '';
          const shortened = shortenHash(full, 6, 6);
          const txHref = chain && full ? `/tx/${encodeURIComponent(chain)}/${encodeURIComponent(full)}` : '';
          return (
            <li
              key={i}
              className="bg-gray-900 border border-blue-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center gap-2">
                  {txHref ? (
                    <Link
                      href={txHref}
                      className="text-cyan-200 font-mono block overflow-x-auto text-sm sm:text-base break-all sm:break-normal hover:text-cyan-100"
                      title="Open transaction details"
                    >
                      <span className="hidden sm:inline">{full}</span>
                      <span className="inline sm:hidden">{shortened}</span>
                    </Link>
                  ) : (
                    <span className="text-cyan-200 font-mono block overflow-x-auto text-sm sm:text-base break-all sm:break-normal">
                      <span className="hidden sm:inline">{full}</span>
                      <span className="inline sm:hidden">{shortened}</span>
                    </span>
                  )}
                  <div className="ml-auto sm:ml-2 relative">
                    <button
                      aria-label={`Copy transaction ${full}`}
                      className="inline-flex items-center justify-center p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                      onClick={() => handleCopy(full)}
                      onMouseEnter={() => setHovered(full)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(full)}
                      onBlur={() => setHovered(null)}
                      title="Copy transaction hash"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4" />
                        <rect x="8" y="7" width="12" height="12" rx="2" ry="2" />
                      </svg>
                    </button>
                    {(hovered === full || copied === full) && (
                      <div className="absolute -top-9 right-0 z-10 px-2 py-1 text-xs rounded bg-gray-800 text-cyan-200 shadow">
                        {copied === full ? 'Copied' : 'Copy'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-cyan-400 text-sm sm:text-base mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <span className="break-all"><strong className="text-cyan-300">From:</strong> {tx.from}</span>
                  <span className="break-all"><strong className="text-cyan-300">To:</strong> {tx.to}</span>
                  <span className="break-all"><strong className="text-cyan-300">Value:</strong> {tx.value}</span>
                </div>

                {(tx as any)?.counterpartyLabel ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-blue-700/60 bg-blue-950/40 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                      {(tx as any).counterpartyType === 'Exchange' ? 'Exchange' : 'Provider'}: {(tx as any).counterpartyLabel}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4 text-right">
                <span className="text-xs text-cyan-500 block">Date: {tx.date ? new Date(tx.date).toLocaleString() : 'N/A'}</span>
                {/* tooltip handles copied state feedback */}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TransactionList;
