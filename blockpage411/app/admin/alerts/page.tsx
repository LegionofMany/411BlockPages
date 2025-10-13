import React from 'react';
import { headers } from 'next/headers';

async function getAlerts(forwardedHeaders: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_APP_URL || '';
  const res = await fetch(`${base}/api/admin/alerts`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      // forward authorization/admin header if present
      Authorization: forwardedHeaders['authorization'] ?? '',
      'x-admin-wallet': forwardedHeaders['x-admin-wallet'] ?? '',
    },
  });
  if (res.status === 403) return { ok: false, forbidden: true, alerts: [] };
  if (!res.ok) return { ok: false, forbidden: false, alerts: [] };
  const json = await res.json();
  return { ok: true, forbidden: false, alerts: json.alerts ?? [] };
}

async function getAlertsHealth(forwardedHeaders: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_APP_URL || '';
  const res = await fetch(`${base}/api/admin/alerts/health`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: forwardedHeaders['authorization'] ?? '',
      'x-admin-wallet': forwardedHeaders['x-admin-wallet'] ?? '',
    },
  });
  if (!res.ok) return { ok: false, counts: { pending: 0, failed: 0, total: 0 } };
  const j = await res.json();
  return { ok: !!j.ok, counts: j.counts ?? { pending: 0, failed: 0, total: 0 } };
}

export default async function Page() {
  const h = await headers();
  const forwarded: Record<string, string | undefined> = {
    authorization: h.get('authorization') ?? undefined,
    'x-admin-wallet': h.get('x-admin-wallet') ?? undefined,
  };
  const result = await getAlerts(forwarded);
  const health = await getAlertsHealth(forwarded);
  if (result.forbidden) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Forbidden</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }
  type AlertItem = {
    _id: string;
    level?: string;
    fundraiserTitle?: string;
    fundraiserId?: string;
    txHash?: string;
    message?: string;
    status?: string;
    attempts?: number;
    createdAt?: string | number | Date;
  };
  const alerts = result.alerts as AlertItem[];
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Alerts</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-300">Pending: <span className="font-semibold text-yellow-300">{health.counts.pending}</span></div>
          <div className="text-sm text-gray-300">Failed: <span className="font-semibold text-red-400">{health.counts.failed}</span></div>
          <div className="text-sm text-gray-300">Total: <span className="font-semibold text-cyan-200">{health.counts.total}</span></div>
        </div>
      </div>
      <table className="w-full mt-4 table-auto">
        <thead>
          <tr>
            <th>ID</th>
            <th>Level</th>
            <th>Fundraiser</th>
            <th>Tx</th>
            <th>Message</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a._id} className="border-t">
              <td className="text-xs">{String(a._id).slice(-6)}</td>
              <td>{a.level}</td>
              <td>{a.fundraiserTitle ?? a.fundraiserId}</td>
              <td className="text-xs">{a.txHash ? String(a.txHash).slice(0, 12) : ''}</td>
              <td className="text-sm">{String(a.message ?? '').slice(0, 80)}</td>
              <td>{a.status}</td>
              <td>{a.attempts}</td>
              <td className="text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
