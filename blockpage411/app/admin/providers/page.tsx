"use client";

import React, { useEffect, useState } from "react";
import AdminGate from "../../components/admin/AdminGate";
import adminFetch from "../../components/admin/adminFetch";

type ProviderType = {
  _id?: string;
  name: string;
  website?: string;
  rank?: number;
  status?: string;
};

type ReportType = {
  _id?: string;
  suspectAddress?: string;
  reporterUserId?: string;
  createdAt?: string | number | Date;
  evidence?: string[];
  status?: string;
};

function normalizeExternalUrl(url?: string) {
  const raw = (url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export default function AdminProvidersPage() {
  const [list, setList] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportsModal, setReportsModal] = useState<{
    open: boolean;
    items: ReportType[];
    provider?: ProviderType;
  }>({ open: false, items: [], provider: undefined });

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetch("/api/admin/providers");
      if (!r.ok) {
        setList([]);
        setError(r.status === 403 ? "Not authorized" : "Failed to load providers");
        return;
      }
      const j = await r.json();
      setList(Array.isArray(j) ? j : []);
    } catch (e) {
      console.error(e);
      setList([]);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function approve(id: string) {
    const r = await adminFetch(`/api/admin/providers/${id}/approve`, {
      method: "PATCH",
    });
    if (!r.ok) return alert("Error approving");
    await fetchList();
  }

  async function viewReports(p: ProviderType) {
    try {
      const r = await adminFetch(`/api/admin/provider-reports?providerId=${p._id}`);
      if (!r.ok) return alert("Failed to fetch reports");
      const j = await r.json();
      setReportsModal({ open: true, items: Array.isArray(j) ? j : [], provider: p });
    } catch (e) {
      console.error(e);
      alert("Failed to fetch reports");
    }
  }

  async function dismissReport(id?: string) {
    if (!id) return;
    try {
      const r = await adminFetch(`/api/admin/reports/${id}/dismiss`, { method: "POST" });
      if (!r.ok) return alert("Failed to dismiss");
      if (reportsModal.provider) await viewReports(reportsModal.provider);
    } catch (e) {
      console.error(e);
      alert("Failed to dismiss");
    }
  }

  return (
    <AdminGate title="Admin — Providers">
      <section className="max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Providers</h2>
        <p className="text-sm text-slate-300/90">Approve new providers and review report activity.</p>
      </section>

      <section className="max-w-6xl">
        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <div className="rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between text-xs text-slate-200">
            <span>Provider list</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{list.length} item(s)</span>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-900/70 transition-colors"
                onClick={fetchList}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-slate-300">Loading…</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {list.length === 0 ? (
                <div className="p-4 text-sm text-slate-300">No providers found.</div>
              ) : null}

              {list.map((p) => {
                const website = normalizeExternalUrl(p.website);
                return (
                  <div key={p._id || p.name} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100">
                        {p.name}{" "}
                        {p.rank ? (
                          <span className="text-xs text-slate-400 font-normal">#{p.rank}</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-300 break-words">
                        {website ? (
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-200 hover:text-emerald-100 underline underline-offset-2"
                          >
                            {p.website}
                          </a>
                        ) : (
                          <span className="text-slate-500">(no website)</span>
                        )}
                      </div>
                      {p.status ? (
                        <div className="mt-2 inline-flex rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] text-slate-200">
                          Status: {p.status}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      {p.status === "pending" && p._id ? (
                        <button
                          type="button"
                          onClick={() => approve(p._id as string)}
                          className="inline-flex items-center rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors"
                        >
                          Approve
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => viewReports(p)}
                        className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/70 transition-colors"
                      >
                        View reports
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {reportsModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-700/70 bg-black/90 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Provider reports</div>
                <div className="text-sm font-semibold text-slate-100">{reportsModal.provider?.name}</div>
              </div>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-900/70 transition-colors"
                onClick={() => setReportsModal({ open: false, items: [], provider: undefined })}
              >
                Close
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-auto">
              {reportsModal.items.length === 0 ? (
                <div className="text-sm text-slate-300">No reports</div>
              ) : (
                <div className="space-y-3">
                  {reportsModal.items.map((r, i) => (
                    <div key={r._id || i} className="rounded-2xl border border-slate-700/70 bg-slate-950/40 p-3">
                      <div className="text-xs text-slate-300">
                        <span className="text-slate-100">Suspect:</span>{" "}
                        <span className="font-mono text-emerald-200 break-all">{r.suspectAddress}</span>
                        <span className="text-slate-500"> · </span>
                        <span className="text-slate-100">Reporter:</span> {r.reporterUserId}
                        <span className="text-slate-500"> · </span>
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </div>

                      {Array.isArray(r.evidence) && r.evidence.length ? (
                        <div className="mt-2 rounded-xl border border-slate-700/70 bg-black/40 p-2">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-1">Evidence</div>
                          <div className="text-xs text-slate-200 break-words">{r.evidence.join(", ")}</div>
                        </div>
                      ) : null}

                      {r._id ? (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full bg-red-600/90 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
                            onClick={() => dismissReport(r._id)}
                          >
                            Dismiss report
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminGate>
  );
}
