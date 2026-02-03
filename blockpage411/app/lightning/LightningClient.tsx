"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type DecodeResponse =
  | {
      kind: 'invoice';
      network: string;
      invoice: string;
      timestamp?: number;
      payeeNodeKey?: string;
      amountSats?: number;
      amountMsat?: string;
      tags?: Record<string, any>;
    }
  | {
      kind: 'lnurl';
      lnurl?: string;
      url: string;
      httpStatus?: number;
      endpoint?: any;
    };

function formatUnix(ts?: number): string {
  if (!ts) return '—';
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function LightningClient() {
  const params = useSearchParams();
  const initial = params?.get('input') || '';

  const [q, setQ] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DecodeResponse | null>(null);

  const trimmed = useMemo(() => q.trim(), [q]);

  async function decode(next: string) {
    const input = next.trim();
    if (!input) return;

    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await fetch(`/api/lightning/decode?q=${encodeURIComponent(input)}`);
      const js = await r.json().catch(() => ({} as any));
      if (!r.ok) {
        setError(String(js?.message || 'Unable to decode Lightning input.'));
        return;
      }
      setData(js as DecodeResponse);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initial) decode(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#020617', color: '#f8fafc' }}>
      <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'rgba(252,211,77,0.96)' }}>
          Bitcoin Lightning
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'rgba(226,232,240,0.88)' }}>
          Paste a BOLT11 invoice (lnbc…), a LNURL (lnurl1…), or a LNURL endpoint URL to decode.
        </p>

        <form
          className="mt-6 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/50 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.65)]"
          onSubmit={(e) => {
            e.preventDefault();
            decode(q);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="lightning:lnbc… or lnurl1…"
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-50 placeholder:text-slate-300/70 outline-none"
            style={{ WebkitTextFillColor: 'rgb(248 250 252)' as any, caretColor: 'rgb(248 250 252)' }}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!trimmed || loading}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? 'Decoding…' : 'Decode'}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        {data ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            {data.kind === 'invoice' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    Invoice
                  </span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">
                    Network: {data.network || 'unknown'}
                  </span>
                  {typeof data.amountSats === 'number' ? (
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">
                      Amount: {data.amountSats.toLocaleString()} sats
                    </span>
                  ) : null}
                </div>

                <div className="text-xs text-slate-200/85">
                  <div>
                    <span className="text-slate-300/80">Created:</span> {formatUnix(data.timestamp)}
                  </div>
                  <div className="mt-1 break-all">
                    <span className="text-slate-300/80">Payee node:</span> {data.payeeNodeKey || '—'}
                  </div>
                </div>

                <details className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-100">Details</summary>
                  <div className="mt-3 text-xs text-slate-200/80 whitespace-pre-wrap break-words">
                    {JSON.stringify(data.tags || {}, null, 2)}
                  </div>
                </details>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-500/15 border border-cyan-400/25 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                    LNURL
                  </span>
                  {typeof data.httpStatus === 'number' ? (
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">
                      HTTP {data.httpStatus}
                    </span>
                  ) : null}
                </div>

                <div className="text-xs text-slate-200/85 break-all">
                  <div>
                    <span className="text-slate-300/80">URL:</span> {data.url}
                  </div>
                </div>

                <details className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-100">Endpoint JSON</summary>
                  <div className="mt-3 text-xs text-slate-200/80 whitespace-pre-wrap break-words">
                    {JSON.stringify(data.endpoint ?? null, null, 2)}
                  </div>
                </details>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
