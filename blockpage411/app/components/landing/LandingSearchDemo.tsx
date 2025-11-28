"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "app/components/ui/Button";
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
};

export default function LandingSearchDemo() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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

  // submit handler (explicit search)
  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await runSearch(q);
  };

  // tiny debounce: auto-trigger suggestions when typing stops
  useEffect(() => {
    if (!q.trim()) {
      return;
    }

    const handle = setTimeout(() => {
      // don't await here to avoid blocking typing; fire-and-forget
      runSearch(q);
    }, 400); // 400ms debounce window

    return () => clearTimeout(handle);
  }, [q, runSearch]);

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
          <p className="text-xs sm:text-sm text-[var(--muted-text)]">Enter an address or ENS to see a concise trust summary — results are limited in this demo.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row items-stretch" role="search" aria-label="Wallet search demo">
          <div className="flex-1 flex items-center gap-2 rounded-2xl" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold tracking-wide" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--muted-text)', border: '1px solid rgba(255,255,255,0.03)' }}>
              ENS
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search wallets by address or ENS name"
              className="flex-1 bg-transparent text-sm focus:outline-none landing-search-input"
              style={{
                color: "#f8fafc",
                caretColor: "#9ca3af",
                outline: 'none'
              }}
              placeholder="Search by address or ENS (e.g. vitalik.eth)"
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            size="md"
            disabled={loading || !q.trim()}
            className="w-full sm:w-auto text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed text-white"
            style={{
              backgroundColor: '#05d07a',
              boxShadow: '0 26px 64px rgba(5,208,122,0.55)'
            }}
          >
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        <div className="mt-2 min-h-[4rem]" aria-live="polite" aria-busy={loading}>
          {error && (
            <div className="rounded-lg bg-red-950/20 px-3 py-2 text-xs text-[var(--color-danger)]/90" style={{ border: "none" }}>
              {error}
            </div>
          )}

          {!error && !loading && !hasSearched && (
            <div className="text-xs text-[var(--muted-text)]">
              Try something like <span className="font-mono text-[var(--color-info)]">vitalik.eth</span> or a known exchange deposit address.
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

                return (
                  <li
                    key={i}
                    className="rounded-xl bg-[var(--color-bg-dark)]/70 p-3.5 sm:p-4 flex flex-col gap-1.5 cursor-pointer transition hover:scale-[1.01] hover:bg-[var(--color-bg-mid)]/85"
                    onClick={() => {
                      const nextQuery = title;
                      setQ(nextQuery);
                      runSearch(nextQuery);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const nextQuery = title;
                        setQ(nextQuery);
                        runSearch(nextQuery);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-xs sm:text-sm font-mono text-slate-100 break-all">
                          {title}
                        </div>
                        {(r.chain || r.network) && (
                          <ChainPill chain={r.chain || "Unknown chain"} network={r.network} />
                        )}
                      </div>
                      {badge && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-bg-light)]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-warning)]">
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] sm:text-xs text-[var(--muted-text)]">{subtitle}</div>
                    {typeof r.riskScore === "number" && (
                      <RiskGauge score={r.riskScore} />
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
