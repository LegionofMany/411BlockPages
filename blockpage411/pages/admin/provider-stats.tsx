import React, { useEffect, useState } from 'react';

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Provider Stats</h1>
        <button onClick={handleExport} disabled={exporting} className="ml-4 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50">
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
