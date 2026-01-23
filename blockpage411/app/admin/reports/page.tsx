"use client";
import React, { useEffect, useState } from 'react';
import AdminGate from '../../components/admin/AdminGate';
import adminFetch from '../../components/admin/adminFetch';

type Report = any;

export default function AdminReportsPage(){
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [filterAddress, setFilterAddress] = useState('');
  const [filterChain, setFilterChain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReporter, setFilterReporter] = useState('');

  async function load(nextPage: number = page){
    setLoading(true);
    try{
      const params = new URLSearchParams({ page: String(nextPage), limit: String(pageSize) } as any);
      if (filterAddress) params.set('address', filterAddress);
      if (filterChain) params.set('chain', filterChain);
      if (filterStatus) params.set('status', filterStatus);
      if (filterReporter) params.set('reporter', filterReporter);
      const res = await adminFetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setReports(json.items || []);
      setTotal(json.total || 0);
    }catch(e){
      console.error(e);
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(page); }, [page]);

  async function dismiss(id: string){
    if (!confirm('Dismiss this report?')) return;
    const res = await adminFetch(`/api/admin/reports/${id}/dismiss`, { method: 'POST' });
    if (res.ok) load(); else alert('Failed to dismiss');
  }

  return (
    <AdminGate title="Moderation — Reports">
      <section className="max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Reports</h2>
        <p className="text-sm text-slate-300/90">
          Review user-submitted reports and dismiss false positives.
        </p>
      </section>

      <section className="max-w-6xl rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            placeholder="Suspect address"
            value={filterAddress}
            onChange={(e) => setFilterAddress(e.target.value)}
            className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            placeholder="Chain"
            value={filterChain}
            onChange={(e) => setFilterChain(e.target.value)}
            className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            placeholder="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            placeholder="Reporter"
            value={filterReporter}
            onChange={(e) => setFilterReporter(e.target.value)}
            className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors"
            onClick={() => {
              setPage(1);
              load(1);
            }}
          >
            Apply filters
          </button>
          <button
            className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/80 transition-colors"
            onClick={async () => {
              const params = new URLSearchParams({ page: String(page), limit: String(pageSize) } as any);
              if (filterAddress) params.set('address', filterAddress);
              if (filterChain) params.set('chain', filterChain);
              if (filterStatus) params.set('status', filterStatus);
              if (filterReporter) params.set('reporter', filterReporter);
              const resp = await adminFetch(`/api/admin/reports/export?${params.toString()}`);
              if (!resp.ok) return alert('Export failed');
              const blob = await resp.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'reports_export.csv';
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
          <div className="ml-auto text-xs text-slate-400 flex items-center">
            {total} total
          </div>
        </div>
      </section>

      <section className="max-w-6xl">
        {loading ? (
          <div className="text-sm text-slate-300">Loading…</div>
        ) : (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="rounded-3xl border border-slate-700/70 bg-black/60 px-4 py-6 text-sm text-slate-200">
                No reports found.
              </div>
            ) : null}

            {reports.map((r: Report) => (
              <div
                key={r._id}
                className="rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-emerald-200 break-all">
                      {r.suspectAddress}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      Chain: <span className="text-slate-100">{r.chain}</span>
                      <span className="text-slate-500"> · </span>
                      Reporter: <span className="text-slate-100">{r.reporterUserId}</span>
                      <span className="text-slate-500"> · </span>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </div>
                    {r.status ? (
                      <div className="mt-2 inline-flex rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] text-slate-200">
                        Status: {r.status}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      className="inline-flex items-center rounded-full bg-red-600/90 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
                      onClick={() => dismiss(r._id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                {Array.isArray(r.evidence) && r.evidence.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-2">
                      Evidence
                    </div>
                    <div className="text-xs text-slate-200 break-words">
                      {r.evidence.join(', ')}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-100 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="text-xs text-slate-300">Page {page}</div>
              <button
                disabled={page * pageSize >= total}
                className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-100 disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminGate>
  );
}
