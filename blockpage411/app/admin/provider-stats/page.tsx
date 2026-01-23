"use client";

import React, { useEffect, useState } from 'react';
import AdminGate from '../../components/admin/AdminGate';
import adminFetch from '../../components/admin/adminFetch';

type ProviderRow = {
  provider?: { _id?: string; name?: string } | null;
  totalReports?: number;
  uniqueReporters?: number;
};

export default function ProviderStatsPage() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetch('/api/admin/provider-stats');
      if (r.status === 403) {
        setRows([]);
        setError('Not authorized');
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } catch (e) {
      console.error(e);
      setRows([]);
      setError('Failed to load provider stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleExport() {
    try {
      setExporting(true);
      const r = await adminFetch('/api/admin/provider-stats.csv');
      if (r.status === 403) {
        setError('Not authorized');
        return;
      }
      if (!r.ok) {
        setError(`Export failed (${r.status})`);
        return;
      }
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'provider-stats.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminGate title="Admin — Provider Stats">
      <section className="max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Provider Stats</h2>
        <p className="text-sm text-slate-300/90">Report volume by provider, including unique reporters.</p>
      </section>

      <section className="max-w-6xl flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/80 transition-colors disabled:opacity-60"
          onClick={fetchStats}
          disabled={loading}
        >
          Refresh
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-60"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Downloading…' : 'Export CSV'}
        </button>
      </section>

      {error ? (
        <div className="max-w-6xl rounded-3xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="max-w-6xl">
        <div className="rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between text-xs text-slate-200">
            <span>Providers</span>
            <span className="text-slate-400">{rows.length} row(s)</span>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-slate-300">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-slate-300">No stats found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left">Provider</th>
                    <th className="px-3 py-2 text-left">Total Reports</th>
                    <th className="px-3 py-2 text-left">Unique Reporters</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                  {rows.map((r, i) => (
                    <tr key={r.provider?._id || i} className="hover:bg-slate-900/70 transition-colors">
                      <td className="px-3 py-2 text-slate-100">{r.provider?.name || 'Unknown'}</td>
                      <td className="px-3 py-2 text-slate-100">{r.totalReports ?? 0}</td>
                      <td className="px-3 py-2 text-slate-100">{r.uniqueReporters ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminGate>
  );
}
