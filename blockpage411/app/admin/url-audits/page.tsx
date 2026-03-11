"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminGate from "../../components/admin/AdminGate";
import adminFetch from "../../components/admin/adminFetch";
import RiskBadge from "../../../components/RiskBadge";

type UrlRiskCategory = "green" | "yellow" | "red";

interface UrlAuditDoc {
  _id: string;
  url: string;
  finalUrl?: string;
  hostname?: string;
  statusCode?: number;
  contentType?: string;
  truncated?: boolean;
  riskScore: number;
  riskCategory: UrlRiskCategory;
  reasons?: string[];
  signals?: any;
  actor?: string;
  createdAt: string;
}

function fmtDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function AdminUrlAuditsPage() {
  const [url, setUrl] = useState("");
  const [audits, setAudits] = useState<UrlAuditDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => audits.find(a => a._id === selectedId) || null, [audits, selectedId]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch("/api/admin/url-audits?limit=50");
      if (!res.ok) throw new Error(`Failed to load url audits (${res.status})`);
      const data = await res.json();
      const items = (data.audits || []) as UrlAuditDoc[];
      setAudits(items);
      if (!selectedId && items.length > 0) setSelectedId(items[0]._id);
    } catch (err) {
      setError((err as Error).message || "Failed to load url audits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = url.trim();
    if (!u) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await adminFetch("/api/admin/url-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Audit failed (${res.status})`);
      }
      const data = await res.json();
      const created = data.audit as UrlAuditDoc;
      setAudits(prev => [created, ...prev].slice(0, 50));
      setSelectedId(created._id);
      setUrl("");
    } catch (err) {
      setError((err as Error).message || "Audit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminGate title="Admin — URL Audits">
      <section className="max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">URL Audits</h2>
        <p className="text-sm text-slate-300/90">
          Run a static URL/script scan (server-side) and review recent audit results.
        </p>
      </section>

      <section className="max-w-6xl">
        <form
          onSubmit={submit}
          className="rounded-3xl border border-emerald-500/25 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 md:p-5"
        >
          <div className="text-xs font-semibold tracking-[0.16em] uppercase text-emerald-200 mb-3">
            Run audit
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
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500/90 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950 hover:bg-emerald-400/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Running..." : "Run"}
            </button>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100 hover:bg-white/10 disabled:opacity-60 transition-colors"
            >
              Refresh
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

      <section className="max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-emerald-500/25 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-500/20 flex items-center justify-between text-xs text-slate-200">
            <span>Recent audits</span>
            <span className="text-emerald-200/90">{audits.length} item(s)</span>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-slate-200">Loading url audits...</div>
          ) : audits.length === 0 ? (
            <div className="p-4 text-sm text-slate-200/80">No audits yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/90 text-sm">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">URL</th>
                    <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">Risk</th>
                    <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                  {audits.map((a) => {
                    const active = a._id === selectedId;
                    return (
                      <tr
                        key={a._id}
                        className={`cursor-pointer hover:bg-slate-900/60 transition-colors ${active ? "bg-slate-900/60" : ""}`}
                        onClick={() => setSelectedId(a._id)}
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs text-slate-100 break-all">{a.url}</div>
                          {a.hostname ? (
                            <div className="text-[11px] uppercase tracking-wide text-white/60 mt-1">{a.hostname}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex items-center gap-2">
                            <RiskBadge score={a.riskScore} category={a.riskCategory} />
                            <span className="text-xs text-white/70">{Math.round(a.riskScore)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-white/70 whitespace-nowrap">
                          {fmtDate(a.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-500/25 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-500/20 flex items-center justify-between text-xs text-slate-200">
            <span>Audit details</span>
            {selected ? (
              <span className="text-emerald-200/90 font-mono">{selected._id}</span>
            ) : (
              <span className="text-slate-400">(none)</span>
            )}
          </div>

          {!selected ? (
            <div className="p-4 text-sm text-slate-200/80">Select an audit to view details.</div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">URL</div>
                <div className="mt-1 text-sm text-slate-100 break-all">{selected.url}</div>
                {selected.finalUrl && selected.finalUrl !== selected.url ? (
                  <div className="mt-2 text-xs text-white/70 break-all">
                    Final: <span className="font-mono">{selected.finalUrl}</span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Risk</div>
                  <div className="mt-2 flex items-center gap-2">
                    <RiskBadge score={selected.riskScore} category={selected.riskCategory} />
                    <div className="text-sm text-slate-100">{Math.round(selected.riskScore)}/100</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Metadata</div>
                  <div className="mt-2 text-xs text-white/70 space-y-1">
                    <div>Status: {typeof selected.statusCode === "number" ? selected.statusCode : "(n/a)"}</div>
                    <div>Type: {selected.contentType || "(n/a)"}</div>
                    <div>Truncated: {selected.truncated ? "Yes" : "No"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Reasons</div>
                {selected.reasons && selected.reasons.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-slate-100/90 space-y-1">
                    {selected.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-xs text-slate-200/70">No reasons recorded.</div>
                )}
              </div>

              {selected.actor ? (
                <div className="text-xs text-white/60">
                  Actor: <span className="font-mono text-emerald-200 break-all">{selected.actor}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </AdminGate>
  );
}
