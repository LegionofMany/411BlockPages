
import React, { useEffect, useState } from "react";

interface AdminAction {
  admin: string;
  action: string;
  target: string;
  reason: string;
  timestamp?: string;
}

const AuditLogTable: React.FC<{ adminWallet: string }> = ({ adminWallet }) => {
  const [auditLog, setAuditLog] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin-actions", {
      headers: { "x-admin-address": adminWallet }
    })
      .then(res => res.json())
      .then(data => {
        setAuditLog(data.actions || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load audit log");
        setLoading(false);
      });
  }, [adminWallet]);

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-indigo-200 mb-4">Admin Audit Log</h2>
      {loading ? (
        <div className="text-indigo-200">Loading audit log...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : auditLog.length === 0 ? (
        <div className="text-indigo-200">No admin actions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 rounded-xl shadow-xl mb-2">
            <thead>
              <tr className="bg-indigo-900 text-indigo-200">
                <th className="py-2 px-4">Admin</th>
                <th className="py-2 px-4">Action</th>
                <th className="py-2 px-4">Target</th>
                <th className="py-2 px-4">Reason</th>
                <th className="py-2 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.slice((page-1)*pageSize, page*pageSize).map((a, i) => (
                <tr key={i} className="border-b border-indigo-800 hover:bg-indigo-950">
                  <td className="py-2 px-4 font-mono text-indigo-300">{a.admin}</td>
                  <td className="py-2 px-4 text-indigo-200">{a.action}</td>
                  <td className="py-2 px-4 text-indigo-100">{a.target}</td>
                  <td className="py-2 px-4 text-indigo-100">{a.reason}</td>
                  <td className="py-2 px-4 text-indigo-400">{a.timestamp ? new Date(a.timestamp).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 items-center justify-end mt-2">
            <button className="px-2 py-1 rounded bg-indigo-800 text-indigo-200 disabled:opacity-50" disabled={page === 1} onClick={() => setPage(Math.max(1, page-1))}>Prev</button>
            <span className="text-indigo-200">Page {page} / {Math.ceil(auditLog.length/pageSize)}</span>
            <button className="px-2 py-1 rounded bg-indigo-800 text-indigo-200 disabled:opacity-50" disabled={page * pageSize >= auditLog.length} onClick={() => setPage(page+1)}>Next</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuditLogTable;
