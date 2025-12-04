import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isAdminRequest } from '../../lib/admin';

type ProviderType = { _id?: string; name: string; website?: string; rank?: number; status?: string };

type EvidenceItem = string;
type ReportType = {
  _id?: string;
  suspectAddress?: string;
  reporterUserId?: string;
  createdAt?: string | number | Date;
  evidence?: EvidenceItem[];
  status?: string;
};

export default function AdminProvidersPage(){
  const [list, setList] = useState<ProviderType[]>([]);
  const [reportsModal, setReportsModal] = useState<{ open: boolean; items: ReportType[]; provider?: ProviderType }>( { open: false, items: [], provider: undefined } );
  useEffect(()=>{ fetchList(); }, []);
  async function fetchList(){
    const r = await fetch('/api/admin/providers', { headers: { 'x-admin-address': process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '' } });
    if (!r.ok) return setList([]);
    const j = await r.json();
    setList(j || []);
  }
  async function approve(id:string){
    const r = await fetch(`/api/admin/providers/${id}/approve`, { method: 'PATCH', headers: { 'x-admin-address': process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '' } });
    if (!r.ok) return alert('Error approving');
    await fetchList();
  }
  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#22c55e' }}>Admin mode · In progress</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginTop: 4 }}>Providers — Admin</h1>
        </div>
        <div style={{ color: '#94A3B8', fontSize: 13 }}>Only visible to signed-in admins</div>
      </header>
      <div className="space-y-2">
        {list.map(p=> (
          <div key={p._id || p.name} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name} {p.rank ? <span className="text-xs text-gray-400">#{p.rank}</span> : null}</div>
              <div className="text-xs text-gray-500">{p.website}</div>
            </div>
            <div className="flex gap-2">
              {p.status === 'pending' && <button onClick={()=>p._id && approve(p._id)} className="btn btn-sm">Approve</button>}
              <button onClick={()=>viewReports(p)} className="btn btn-sm">View Reports</button>
              <a href={`/admin/providers/${p._id}`} className="text-sm text-gray-600">Details</a>
            </div>
          </div>
        ))}
      </div>
      {reportsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg w-full max-w-3xl p-6">
            <h3 className="text-lg font-semibold">Reports for {reportsModal.provider?.name}</h3>
            <div className="mt-4 max-h-96 overflow-auto">
              {reportsModal.items.length === 0 && <div className="text-sm text-gray-500">No reports</div>}
              {reportsModal.items.map((r, i) => (
                <div key={r._id || i} className="p-2 border-b">
                  <div className="text-sm">Suspect: {r.suspectAddress} — Reporter: {r.reporterUserId} — Date: {(new Date(r.createdAt || Date.now())).toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Evidence: {r.evidence && r.evidence.length ? r.evidence.map((e: EvidenceItem, idx: number) => (<pre key={idx} className="text-xs bg-gray-100 p-1 mt-1">{e}</pre>)) : 'None'}</div>
                  <div className="mt-2"><button className="btn btn-sm" onClick={()=>dismissReport(r._id)}>Dismiss</button></div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4"><button className="btn" onClick={()=>setReportsModal({ open:false, items: [], provider: undefined })}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );

  async function viewReports(p: ProviderType){
    try{
      const r = await fetch(`/api/admin/provider-reports?providerId=${p._id}`, { headers: { 'x-admin-address': process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '' } });
      if (!r.ok) return alert('Failed to fetch reports');
      const j = await r.json();
      setReportsModal({ open: true, items: j || [], provider: p });
    }catch(e){ console.error(e); alert('Failed to fetch reports'); }
  }

  async function dismissReport(id?: string){
    if (!id) return; try{
      const r = await fetch(`/api/admin/reports/${id}/dismiss`, { method: 'POST', headers: { 'x-admin-address': process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '' } });
      if (!r.ok) return alert('Failed to dismiss');
      // refresh
      if (reportsModal.provider) await viewReports(reportsModal.provider);
    }catch(e){ console.error(e); alert('Failed to dismiss'); }
  }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, res } = context;
  try {
    if (!isAdminRequest(req as any)) {
      res.statusCode = 404;
      return { notFound: true };
    }
    return { props: {} };
  } catch (err) {
    res.statusCode = 404;
    return { notFound: true };
  }
};
