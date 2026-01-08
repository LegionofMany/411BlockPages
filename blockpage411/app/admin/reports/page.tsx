"use client";
import React, { useEffect, useState } from 'react';

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

  async function load(){
    setLoading(true);
    try{
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) } as any);
      if (filterAddress) params.set('address', filterAddress);
      if (filterChain) params.set('chain', filterChain);
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setReports(json.items || []);
      setTotal(json.total || 0);
    }catch(e){
      console.error(e);
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function dismiss(id: string){
    if (!confirm('Dismiss this report?')) return;
    const res = await fetch(`/api/admin/reports/${id}/dismiss`, { method: 'POST' });
    if (res.ok) load(); else alert('Failed to dismiss');
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Moderation — Reports</h1>
      <p className="text-sm text-gray-600">Lists recent reports. Actions are protected by admin auth.</p>
      <div className="mt-3 flex gap-2 items-center flex-wrap">
        <input placeholder="address" value={filterAddress} onChange={e=>setFilterAddress(e.target.value)} className="border rounded px-2 py-1" />
        <input placeholder="chain" value={filterChain} onChange={e=>setFilterChain(e.target.value)} className="border rounded px-2 py-1" />
        <input placeholder="status (open|reviewed|closed)" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="border rounded px-2 py-1" />
        <input placeholder="reporter address" value={filterReporter} onChange={e=>setFilterReporter(e.target.value)} className="border rounded px-2 py-1" />
        <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>{ setPage(1); load(); }}>Filter</button>
        <button className="px-2 py-1 bg-gray-700 text-white rounded" onClick={async()=>{
          const params = new URLSearchParams({ page: String(page), limit: String(pageSize) } as any);
          if (filterAddress) params.set('address', filterAddress);
          if (filterChain) params.set('chain', filterChain);
          if (filterStatus) params.set('status', filterStatus);
          if (filterReporter) params.set('reporter', filterReporter);
          const resp = await fetch(`/api/admin/reports/export?${params.toString()}`);
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
        }}>Export CSV</button>
      </div>
      {loading ? <p>Loading…</p> : (
        <div className="mt-4 space-y-3">
          {reports.length === 0 && <div className="text-gray-500">No reports found.</div>}
          {reports.map((r: Report)=> (
            <div key={r._id} className="border rounded p-3 bg-white">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{r.suspectAddress} <span className="text-xs text-gray-500">({r.chain})</span></div>
                  <div className="text-sm text-gray-600">Reported by: {r.reporterUserId} — {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>dismiss(r._id)}>Dismiss</button>
                </div>
              </div>
              {Array.isArray(r.evidence) && r.evidence.length>0 && (
                <div className="mt-2 text-sm text-gray-700">Evidence: {r.evidence.join(', ')}</div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3">
            <button disabled={page<=1} className="px-2 py-1 border rounded" onClick={async()=>{ setPage(p=>Math.max(1,p-1)); await load(); }}>Prev</button>
            <div>Page {page} — {total} results</div>
            <button disabled={(page*pageSize)>=total} className="px-2 py-1 border rounded" onClick={async()=>{ setPage(p=>p+1); await load(); }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
