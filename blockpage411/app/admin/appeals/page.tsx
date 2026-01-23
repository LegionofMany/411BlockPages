"use client";
import React, { useEffect, useState } from 'react';
import AdminGate from '../../components/admin/AdminGate';
import adminFetch from '../../components/admin/adminFetch';

type Appeal = any;

export default function AdminAppealsPage(){
  const [items, setItems] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [filterAddress, setFilterAddress] = useState('');
  const [filterChain, setFilterChain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  async function load(nextPage: number = page){
    setLoading(true);
    try{
      const params = new URLSearchParams({ page: String(nextPage), limit: String(pageSize) } as any);
      if (filterAddress) params.set('address', filterAddress);
      if (filterChain) params.set('chain', filterChain);
      if (filterStatus) params.set('status', filterStatus);
      const res = await adminFetch(`/api/admin/appeals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setItems(json.items || []);
      setTotal(json.total || 0);
    }catch(e){ console.error(e); } finally{ setLoading(false); }
  }

  useEffect(()=>{ load(page); }, [page]);

  async function review(id: string, action: 'resolved'|'rejected'){
    if (!confirm(`Mark appeal ${action}?`)) return;
    const res = await adminFetch(`/api/admin/appeals/${id}/review`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action }) });
    if (res.ok) load(); else alert('Failed to update');
  }

  return (
    <AdminGate title="Moderation — Appeals">
      <section className="max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Appeals</h2>
        <p className="text-sm text-slate-300/90">
          Review appeals from wallets requesting status changes.
        </p>
      </section>

      <section className="max-w-6xl rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            placeholder="Wallet address"
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
            placeholder="Status (under_review|resolved|rejected)"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors"
            onClick={() => {
              setPage(1);
              load(1);
            }}
          >
            Apply filters
          </button>
          <div className="ml-auto text-xs text-slate-400">{total} total</div>
        </div>
      </section>

      <section className="max-w-6xl">
        {loading ? (
          <div className="text-sm text-slate-300">Loading…</div>
        ) : (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-slate-700/70 bg-black/60 px-4 py-6 text-sm text-slate-200">
                No appeals found.
              </div>
            ) : null}

            {items.map((a) => (
              <div
                key={a._id}
                className="rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-emerald-200 break-all">{a.address}</div>
                    <div className="mt-1 text-xs text-slate-300">
                      Chain: <span className="text-slate-100">{a.chain}</span>
                      <span className="text-slate-500"> · </span>
                      Submitted: {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                    </div>
                    <div className="mt-2 inline-flex rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] text-slate-200">
                      Status: {a.status}
                    </div>
                    {a.contactEmail ? (
                      <div className="mt-2 text-xs text-slate-400">
                        Contact: <span className="text-slate-200">{a.contactEmail}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="inline-flex items-center rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors"
                      onClick={() => review(a._id, 'resolved')}
                    >
                      Resolve
                    </button>
                    <button
                      className="inline-flex items-center rounded-full bg-amber-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
                      onClick={() => review(a._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {Array.isArray(a.evidence) && a.evidence.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-2">Evidence</div>
                    <ul className="space-y-2">
                      {a.evidence.map((e: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-200 break-words">
                          {e}
                        </li>
                      ))}
                    </ul>
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
