"use client";

import React, { useMemo, useState } from "react";
import RiskBadge from "@/components/RiskBadge";

type UrlRiskCategory = "green" | "yellow" | "red";

interface UrlAuditResponse {
  audit: {
    _id?: string;
    url: string;
    finalUrl?: string;
    hostname?: string;
    statusCode?: number;
    contentType?: string;
    truncated?: boolean;
    riskScore: number;
    riskCategory: UrlRiskCategory;
    reasons: string[];
    signals?: any;
    createdAt?: string;
  };
}

export default function UrlThreatScanPage() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlAuditResponse | null>(null);

  const canRun = useMemo(() => url.trim().length > 0 && !submitting, [url, submitting]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const u = url.trim();
    if (!u) return;

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/url/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: u }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Audit failed (${res.status})`);
      }

      const data = (await res.json()) as UrlAuditResponse;
      setResult(data);
    } catch (err) {
      setError((err as Error).message || "Audit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const audit = result?.audit;

  return (
    <div className="flex flex-col items-center w-full pt-10 pb-16 px-4">
      <section className="w-full max-w-4xl">
        <div className="text-xs font-semibold tracking-[0.16em] uppercase text-emerald-200/90 mb-2">
          Security
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-amber-100">URL Threat Scan</h1>
        <p className="mt-2 text-sm text-slate-200/80">
          Scan a URL for drainer-style signals (static source analysis + fingerprint checks). This does not connect a real wallet.
        </p>
      </section>

      <section className="w-full max-w-4xl mt-6">
        <form
          onSubmit={run}
          className="rounded-3xl border border-emerald-500/25 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 md:p-6"
        >
          <div className="text-xs font-semibold tracking-[0.16em] uppercase text-emerald-200 mb-3">
            Scan a URL
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/claim"
              className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-white/40"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!canRun}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500/90 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950 hover:bg-emerald-400/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Scanning..." : "Scan"}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm">
              <div className="font-semibold text-red-200 mb-1">Error</div>
              <div className="text-red-100/90 break-words">{error}</div>
            </div>
          ) : null}
        </form>
      </section>

      {audit ? (
        <section className="w-full max-w-4xl mt-6">
          <div className="rounded-3xl border border-emerald-500/25 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-500/20 flex items-center justify-between text-xs text-slate-200">
              <span>Result</span>
              <span className="text-emerald-200/90">{audit.hostname || "(unknown host)"}</span>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">URL</div>
                <div className="mt-1 text-sm text-slate-100 break-all">{audit.url}</div>
                {audit.finalUrl && audit.finalUrl !== audit.url ? (
                  <div className="mt-2 text-xs text-white/70 break-all">
                    Final: <span className="font-mono">{audit.finalUrl}</span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Risk</div>
                  <div className="mt-2 flex items-center gap-2">
                    <RiskBadge score={audit.riskScore} category={audit.riskCategory} />
                    <div className="text-sm text-slate-100">{Math.round(audit.riskScore)}/100</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Metadata</div>
                  <div className="mt-2 text-xs text-white/70 space-y-1">
                    <div>Status: {typeof audit.statusCode === "number" ? audit.statusCode : "(n/a)"}</div>
                    <div>Type: {audit.contentType || "(n/a)"}</div>
                    <div>Truncated: {audit.truncated ? "Yes" : "No"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Reasons</div>
                {audit.reasons && audit.reasons.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-slate-100/90 space-y-1">
                    {audit.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-xs text-slate-200/70">No reasons recorded.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="w-full max-w-4xl mt-6 text-xs text-slate-200/60">
        This scanner performs server-side fetching with guardrails to reduce SSRF risk. For deep dynamic sandboxing (Playwright), run in an isolated worker environment.
      </section>
    </div>
  );
}
