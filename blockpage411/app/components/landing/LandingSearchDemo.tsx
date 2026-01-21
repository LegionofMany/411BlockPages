"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

import { Card, CardBody } from "app/components/ui/Card";
import { ChainPill } from "app/components/ui/ChainPill";
import { RiskGauge } from "app/components/ui/RiskGauge";

type SearchResult = {
  address?: string;
  id?: string;
  name?: string;
  summary?: string;
  description?: string;
  riskScore?: number;
  chain?: string;
  network?: string;
  tags?: string[];
  blacklisted?: boolean;
  blacklistReason?: string;
  flagsCount?: number;
  flagsSummary?: string[];
  kycStatus?: string;
  socials?: { displayName?: string; avatarUrl?: string };
  trustScore?: number;
};

export default function LandingSearchDemo() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const demoQuery = 'vitalik.eth';

  // core search function used by submit + debounce
  const runSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=3`);
        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`);
        }
        const js = await res.json();
        setResults(js.results || []);
      } catch (err) {
        console.error("search demo error", err);
        setError("We couldn't fetch results right now. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Auto-load a single example so the landing page doesn't render a second search bar.
    void runSearch(demoQuery);
  }, [runSearch]);

  const showEmptyMessage = hasSearched && !loading && !error && results.length === 0;

  return (
    <Card
      className="w-full max-w-3xl mx-auto rounded-2xl"
      style={{
        border: "none",
        // match hero: dark translucent card for contrast on page background
        backgroundColor: "rgba(0,0,0,0.82)",
        boxShadow: "0 26px 70px rgba(0,0,0,0.95)",
        backdropFilter: "blur(26px)",
        WebkitBackdropFilter: "blur(26px)",
        maxWidth: '1000px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm sm:text-base font-semibold" style={{ color: '#fff' }}>Quick wallet reputation check</h2>
          <p className="text-xs sm:text-sm text-[var(--muted-text)]">
            Example result for <span className="font-mono text-slate-200">{demoQuery}</span>. Use the search bar above to look up any wallet.
          </p>
        </div>

        <div className="mt-2 min-h-[4rem]" aria-live="polite" aria-busy={loading}>
          {error && (
            <div className="rounded-lg bg-red-950/20 px-3 py-2 text-xs text-[var(--color-danger)]/90" style={{ border: "none" }}>
              {error}
            </div>
          )}

          {!error && !loading && !hasSearched && (
            <div className="text-xs text-[var(--muted-text)]">
              Loading example…
            </div>
          )}

          {!error && loading && (
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <span className="h-2 w-2 animate-ping rounded-full bg-[var(--color-warning)]" />
              <span>Scanning on-chain signals…</span>
            </div>
          )}

          {showEmptyMessage && (
            <div className="text-xs text-[var(--muted-text)]">
              No demo matches for that input. Try a different ENS name, wallet address, or exchange-tagged wallet.
            </div>
          )}

          {!error && results.length > 0 && (
            <ul className="mt-3 space-y-2">
              {results.map((r, i) => {
                const title = r.address || r.id || r.name || "Wallet";
                const subtitle = r.summary || r.description || "No summary available.";
                const badge = typeof r.riskScore === "number" ? `${r.riskScore.toFixed(0)} risk score` : null;
                const tags = r.tags || [];
                const flagsCount = r.flagsCount || 0;
                const isBlacklisted = !!r.blacklisted;
                const displayName = r.socials?.displayName;
                const avatar = r.socials?.avatarUrl;
                const trustScore = typeof r.trustScore === 'number' ? r.trustScore : undefined;
                return (
                  <li
                    key={i}
                    className="rounded-xl bg-[var(--color-bg-dark)]/70 p-3.5 sm:p-4 flex flex-col gap-1.5 cursor-pointer transition hover:scale-[1.01] hover:bg-[var(--color-bg-mid)]/85"
                    onClick={() => {
                      if (!r.address) return;
                      if (r.chain) {
                        router.push(`/wallet/${encodeURIComponent(r.chain)}/${encodeURIComponent(r.address)}`);
                      } else {
                        // Fallback: default-chain wallet route.
                        const dc = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN || 'ethereum').toLowerCase();
                        const chain = dc === 'eth' ? 'ethereum' : dc;
                        router.push(`/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(r.address)}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!r.address) return;
                        if (r.chain) {
                          router.push(`/wallet/${encodeURIComponent(r.chain)}/${encodeURIComponent(r.address)}`);
                        } else {
                          const dc = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN || 'ethereum').toLowerCase();
                          const chain = dc === 'eth' ? 'ethereum' : dc;
                          router.push(`/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(r.address)}`);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {avatar ? (
                          <img src={avatar} alt={displayName || title} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-xs text-slate-200 font-semibold">W</div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                            {displayName ? `${displayName} — ${title}` : title}
                          </div>
                          {(r.chain || r.network) && (
                            <ChainPill chain={r.chain || "Unknown chain"} network={r.network} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {trustScore !== undefined && (
                          <span className="inline-flex items-center rounded-full bg-[var(--color-bg-light)]/90 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
                            Trust {Math.round(trustScore)}
                          </span>
                        )}
                        {badge && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-bg-light)]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-warning)]">
                            {badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs text-[var(--muted-text)]">{subtitle}</div>
                    <div className="mt-1 flex items-center gap-2">
                      {r.kycStatus && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.kycStatus === 'verified' ? 'bg-emerald-700 text-white' : 'bg-yellow-700 text-white'}`}>
                          {r.kycStatus}
                        </span>
                      )}
                      {isBlacklisted && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-700 text-white">Blacklisted</span>
                      )}
                      {flagsCount > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-mid)]/80 text-slate-200">{flagsCount} flags</span>
                      )}
                    </div>
                    {typeof r.riskScore === "number" && (
                      <RiskGauge score={r.riskScore} />
                    )}
                    {r.flagsSummary && r.flagsSummary.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.flagsSummary.map((f, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-full bg-red-800/60 px-2 py-[2px] text-[10px] font-medium text-white">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-[var(--color-bg-mid)]/80 px-2 py-[2px] text-[10px] font-medium text-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
