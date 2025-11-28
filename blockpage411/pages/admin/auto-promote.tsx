import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { isAdminRequest } from '../../lib/admin';

type Candidate = { provider?: { _id?: string; name?: string; readyForOutreach?: boolean }; totalReports?: number; uniqueReporters?: number };
type AutoPromoteResult = { candidates?: Candidate[]; promoted?: number; skipped?: number } | null;

const AdminAutoPromotePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AutoPromoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    setError(null);
    setLoading(true);
    setResults(null);
    try{
      const admin = typeof window !== 'undefined' ? (localStorage.getItem('wallet') || '') : '';
  const res = await fetch('/api/admin/auto-promote', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-address': admin }, body: JSON.stringify({ dryRun }) });
  const json = await res.json();
  if (!res.ok) throw new Error((json && (json as { message?: string }).message) || 'Request failed');
  setResults(json as AutoPromoteResult);
    }catch(e){
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Auto-Promote Providers</h1>
      <p style={{ marginBottom: 12, color: '#9AA8B3' }}>Run the auto-promotion routine to mark providers as ready for outreach based on reports.</p>
      <div className="flex gap-3 mb-4">
        <button className="btn-primary" onClick={() => run(true)} disabled={loading}>Dry-run</button>
        <button className="btn-primary" onClick={() => run(false)} disabled={loading}>Run</button>
        <button className="btn-secondary" onClick={async () => {
          try{
            const admin = typeof window !== 'undefined' ? (localStorage.getItem('wallet') || '') : '';
            const resp = await fetch('/api/admin/promoted-providers.csv', { method: 'GET', headers: { 'x-admin-address': admin } });
            if (!resp.ok) { const t = await resp.text(); throw new Error(t || 'Failed to download CSV'); }
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'promoted-providers.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }catch(err){
            console.error('Export CSV failed', err);
            setError(String((err as Error).message || err));
          }
        }}>Export CSV</button>
      </div>
      {loading && <div>Running...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {results !== null && (
        <div className="mt-4">
          <h2 className="font-semibold">Results</h2>
          <div className="overflow-auto border rounded mt-2">
            {/* show candidate table when available */}
            {Array.isArray(results?.candidates) ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 text-left">Provider</th>
                    <th className="px-2 py-1">Reports</th>
                    <th className="px-2 py-1">Unique Reporters</th>
                    <th className="px-2 py-1">Ready</th>
                  </tr>
                </thead>
                <tbody>
                  {results!.candidates!.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{(c.provider && c.provider.name) || (c.provider && c.provider._id) || 'Unknown'}</td>
                      <td className="px-2 py-1 text-center">{c.totalReports}</td>
                      <td className="px-2 py-1 text-center">{c.uniqueReporters}</td>
                      <td className="px-2 py-1 text-center">{c.provider && c.provider.readyForOutreach ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ):(
              <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded mt-2">{JSON.stringify(results, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAutoPromotePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  try {
    if (!isAdminRequest(req as any)) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    return { props: {} };
  } catch (err) {
    return { redirect: { destination: '/login', permanent: false } };
  }
};
