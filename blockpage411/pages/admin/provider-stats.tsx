import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isAdminRequest } from '../../lib/admin';

type ProviderRow = { provider?: { name?: string } | null; totalReports?: number; uniqueReporters?: number };

export default function ProviderStats(){
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [exporting, setExporting] = useState(false);
  useEffect(()=>{ fetchStats(); }, []);
  async function fetchStats(){
    const r = await fetch('/api/admin/provider-stats', { headers: { 'x-admin-address': process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '' } });
    if (!r.ok) return;
    const j = await r.json();
    setRows(j || []);
  }

  async function handleExport(){
    try{
      setExporting(true);
      const r = await fetch('/api/admin/provider-stats.csv', { headers: { 'x-admin-address': process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '' } });
      if (!r.ok) {
        console.error('Export failed', r.status);
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
    }catch(err){
      console.error('Export error', err);
    }finally{
      setExporting(false);
    }
  }
  return (
    <div style={{ padding: 24, maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#22c55e' }}>Admin mode · In progress</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>Provider Stats</h1>
        </div>
        <button onClick={handleExport} disabled={exporting} style={{ marginLeft: 12, background: '#2563EB', color: '#fff', padding: '8px 12px', borderRadius: 6, opacity: exporting ? 0.6 : 1 }}>
          {exporting ? 'Downloading...' : 'Export CSV'}
        </button>
      </div>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left"><th className="p-2">Provider</th><th className="p-2">Total Reports</th><th className="p-2">Unique Reporters</th></tr>
        </thead>
        <tbody>
          {rows.map((r,i)=> (
            <tr key={i} className="border-t"><td className="p-2">{r.provider?.name || 'Unknown'}</td><td className="p-2">{r.totalReports}</td><td className="p-2">{r.uniqueReporters}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
