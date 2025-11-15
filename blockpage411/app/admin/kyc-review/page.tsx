"use client";
import React, { useEffect, useState } from 'react';

export default function KycReview() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/pending-socials', { credentials: 'include' });
        if (!res.ok) { setError('Failed to load'); return; }
        const data = await res.json();
        setItems(data.users || []);
      } catch (e) { setError('Network error'); }
      setLoading(false);
    })();
  }, []);

  async function approve(address: string, platform: string, handle: string) {
    try {
      const res = await fetch('/api/admin/approve-social', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, platform, handle }) });
      if (!res.ok) { alert('Approve failed'); return; }
      alert('Approved');
      setItems(items.filter(i => i.address !== address));
    } catch { alert('Network error'); }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Pending Social Verifications</h1>
      {items.length === 0 ? <div>No pending items</div> : (
        <div className="space-y-4">
          {items.map((u, i) => (
            <div key={i} className="p-3 border rounded bg-slate-900">
              <div className="font-semibold">{u.address}</div>
              <div className="mt-2">
                {(u.pendingSocialVerifications || []).map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>{p.platform}: {p.handle} — code: {p.code}</div>
                    <div><button className="btn btn-sm" onClick={()=>approve(u.address, p.platform, p.handle)}>Approve</button></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
