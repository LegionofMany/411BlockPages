"use client";
import React, { useEffect, useState } from 'react';

type Appeal = any;

export default function AdminAppealsPage(){
  const [items, setItems] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [filterAddress, setFilterAddress] = useState('');
  const [filterChain, setFilterChain] = useState('');

  async function load(){
    setLoading(true);
    try{
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) } as any);
      if (filterAddress) params.set('address', filterAddress);
      if (filterChain) params.set('chain', filterChain);
      const res = await fetch(`/api/admin/appeals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setItems(json.items || []);
      setTotal(json.total || 0);
    }catch(e){ console.error(e); } finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); }, [page]);

  async function review(id: string, action: 'resolved'|'rejected'){
    if (!confirm(`Mark appeal ${action}?`)) return;
    const res = await fetch(`/api/admin/appeals/${id}/review`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action }) });
    if (res.ok) load(); else alert('Failed to update');
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Moderation — Appeals</h1>
      <p className="text-sm text-gray-600">List of submitted appeals. Actions are protected by admin auth.</p>
      <div className="mt-3 flex gap-2 items-center">
        <input placeholder="address" value={filterAddress} onChange={e=>setFilterAddress(e.target.value)} className="border rounded px-2 py-1" />
        <input placeholder="chain" value={filterChain} onChange={e=>setFilterChain(e.target.value)} className="border rounded px-2 py-1" />
        <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>{ setPage(1); load(); }}>Filter</button>
      </div>
      {loading ? <p>Loading…</p> : (
        <div className="mt-4 space-y-3">
          {items.length === 0 && <div className="text-gray-500">No appeals found.</div>}
          {items.map(a => (
            <div key={a._id} className="border rounded p-3 bg-white">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{a.address} <span className="text-xs text-gray-500">({a.chain})</span></div>
                  <div className="text-sm text-gray-600">Submitted: {new Date(a.createdAt).toLocaleString()} — Status: {a.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={()=>review(a._id, 'resolved')}>Resolve</button>
                  <button className="px-2 py-1 bg-yellow-600 text-white rounded" onClick={()=>review(a._id, 'rejected')}>Reject</button>
                </div>
              </div>
              {Array.isArray(a.evidence) && a.evidence.length>0 && (
                <div className="mt-2 text-sm text-gray-700">Evidence: {a.evidence.join(', ')}</div>
              )}
              {a.contactEmail && <div className="mt-2 text-xs text-gray-500">Contact: {a.contactEmail}</div>}
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
