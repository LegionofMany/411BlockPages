"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

type SearchResult = {
  address?: string;
  chain?: string;
  network?: string;
  id?: string;
  name?: string;
  ens?: string;
  summary?: string;
  description?: string;
  socials?: { displayName?: string; avatarUrl?: string };
  trustScore?: number;
  riskScore?: number;
  flagsCount?: number;
  blacklisted?: boolean;
  kycStatus?: string;
  statusTags?: string[];
};

type ResolveWalletResponse = {
  address: string;
  resolvedFrom: string;
  chainHint?: string;
};

type Props = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  autoFocus?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
};

function normalizeChain(chain?: string | null): string {
  const c = String(chain || '').toLowerCase();
  if (!c) return '';
  if (c === 'eth') return 'ethereum';
  if (c === 'btc') return 'bitcoin';
  if (c === 'sol') return 'solana';
  return c;
}

function defaultChain(): string {
  // Only NEXT_PUBLIC_* is available in the browser.
  return normalizeChain(process.env.NEXT_PUBLIC_DEFAULT_CHAIN || 'ethereum') || 'ethereum';
}

function toWalletPath(chain: string, address: string): string {
  return `/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`;
}

export default function WalletSearchBar({
  className,
  inputClassName,
  placeholder = 'Search wallet (address, ENS, Base name, or UD)',
  size = 'md',
  autoFocus,
  showSuggestions = true,
  maxSuggestions = 5,
}: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<SearchResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const height = size === 'sm' ? 'h-10' : 'h-12';

  const runSearch = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSuggestions([]);
        return;
      }

      try {
        abortRef.current?.abort();
      } catch {
        // ignore
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({ q: trimmed });
        const res = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const js = await res.json().catch(() => ({} as any));
        const list = Array.isArray(js?.results) ? (js.results as SearchResult[]) : [];
        setSuggestions(list.slice(0, maxSuggestions));
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setSuggestions([]);
      }
    },
    [maxSuggestions]
  );

  React.useEffect(() => {
    if (!showSuggestions) return;
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(() => {
      void runSearch(q);
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, runSearch, showSuggestions]);

  React.useEffect(() => {
    return () => {
      try {
        abortRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  function navigate(chain: string, address: string) {
    router.push(toWalletPath(chain, address));
  }

  function navigateToResult(r: SearchResult) {
    const address = typeof r?.address === 'string' ? r.address : undefined;
    if (!address) return;

    const chain = normalizeChain(r.chain || r.network) || defaultChain();
    navigate(chain, address);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = q.trim();
    if (!next) return;

    setLoading(true);
    setError(null);
    setSuggestionsOpen(false);

    try {
      // Try search first so we can pick the right chain when available.
      try {
        const params = new URLSearchParams({ q: next });
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const js = await res.json().catch(() => ({} as any));
          const list = Array.isArray(js?.results) ? (js.results as SearchResult[]) : [];
          const first = list.find((x) => typeof x?.address === 'string');
          if (first?.address) {
            navigateToResult(first);
            return;
          }
        }
      } catch {
        // ignore and fall back to resolve
      }

      // Fallback: resolve ENS/Base name/UD/address to an address (and chainHint).
      const r = await fetch(`/api/resolve-wallet?q=${encodeURIComponent(next)}`);
      if (!r.ok) {
        setError('No results found.');
        return;
      }
      const resolved = (await r.json().catch(() => null)) as ResolveWalletResponse | null;
      if (!resolved?.address) {
        setError('No results found.');
        return;
      }
      const chain = normalizeChain(resolved.chainHint) || defaultChain();
      navigate(chain, resolved.address);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative">
        <div
          className={`flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/40 px-3 ${height} shadow-[0_12px_30px_rgba(0,0,0,0.55)] focus-within:ring-2 focus-within:ring-emerald-300/40`}
        >
          <span aria-hidden="true" className="text-slate-200">
            🔎
          </span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (showSuggestions) setSuggestionsOpen(true);
            }}
            autoFocus={autoFocus}
            onFocus={() => {
              if (showSuggestions) setSuggestionsOpen(true);
            }}
            onBlur={() => {
              // Delay closing so click events on suggestions can fire
              window.setTimeout(() => setSuggestionsOpen(false), 120);
            }}
            // Some global/UA styles (especially WebKit autofill/text-fill) can make typed text effectively invisible.
            // Force the actual rendered text color + caret color here to keep it readable.
            style={{
              color: 'rgb(248 250 252)',
              WebkitTextFillColor: 'rgb(248 250 252)' as any,
              caretColor: 'rgb(248 250 252)',
            }}
            className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-300/70 !text-slate-50 caret-slate-50 ${
              inputClassName || ''
            }`}
            placeholder={placeholder}
            inputMode="text"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-300"
          >
            {loading ? 'Searching…' : 'Go'}
          </button>
        </div>

        {showSuggestions && suggestionsOpen && q.trim() && suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/95 shadow-[0_18px_60px_rgba(0,0,0,0.72)]">
            <ul className="max-h-[320px] overflow-auto py-2">
              {suggestions.map((r, idx) => {
                const title = r.socials?.displayName || r.name || r.ens || r.id || r.address || 'Wallet';
                const subtitle = r.summary || r.description || (r.address ? String(r.address) : '');
                const trustScore = typeof r.trustScore === 'number' ? r.trustScore : undefined;
                const riskScore = typeof r.riskScore === 'number' ? r.riskScore : undefined;
                const flagsCount = typeof r.flagsCount === 'number' ? r.flagsCount : 0;
                const avatar = r.socials?.avatarUrl;
                const chain = normalizeChain(r.chain || r.network);

                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => navigateToResult(r)}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-semibold text-slate-50">
                            W
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs sm:text-sm font-semibold text-slate-50 truncate">{title}</div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {chain ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-100">
                                  {chain}
                                </span>
                              ) : null}
                              {r.blacklisted ? (
                                <span className="rounded-full bg-red-600/20 border border-red-400/30 px-2 py-0.5 text-[10px] font-semibold text-red-200">
                                  Blacklisted
                                </span>
                              ) : null}
                              {r.kycStatus === 'verified' ? (
                                <span className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                                  Verified
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {subtitle ? (
                            <div className="mt-0.5 text-[11px] text-slate-200/85 line-clamp-2">{subtitle}</div>
                          ) : null}

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-200/90">
                            {trustScore !== undefined ? (
                              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">
                                Trust {Math.round(trustScore)}
                              </span>
                            ) : null}
                            {riskScore !== undefined ? (
                              <span className="rounded-full bg-amber-500/10 border border-amber-400/20 px-2 py-0.5 text-amber-100">
                                Risk {Math.round(riskScore)}
                              </span>
                            ) : null}
                            {flagsCount > 0 ? (
                              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">
                                {flagsCount} flags
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {error ? <div className="mt-2 text-xs text-rose-300">{error}</div> : null}
    </form>
  );
}
