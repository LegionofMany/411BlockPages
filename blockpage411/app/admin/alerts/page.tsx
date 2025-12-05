import React from 'react';
import { headers } from 'next/headers';
import AdminLayout from '../../components/admin/AdminLayout';
import { redirect } from 'next/navigation';

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
    // fallback: send non-admins to main admin gate, which already has
    // a friendly access denied screen
    redirect('/admin');
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
  // adminWallet not surfaced from headers here; show placeholder in shell
  return (
    <AdminLayout currentPath="/admin/alerts" adminWallet="">
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Alerts & Delivery Health</h2>
        <p className="text-sm text-slate-300/90">
          Monitor webhook and fundraising alerts, and keep an eye on failures that
          may affect partners or downstream systems.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mb-6">
        <div className="rounded-3xl bg-black/70 border border-amber-400/30 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-amber-200/90 mb-1">Pending</div>
          <div className="text-2xl font-semibold text-amber-100">{health.counts.pending}</div>
          <p className="mt-1 text-[11px] text-amber-100/80">Alerts queued for processing.</p>
        </div>
        <div className="rounded-3xl bg-black/70 border border-red-500/40 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-red-200/90 mb-1">Failed</div>
          <div className="text-2xl font-semibold text-red-100">{health.counts.failed}</div>
          <p className="mt-1 text-[11px] text-red-100/80">Alerts that need admin review.</p>
        </div>
        <div className="rounded-3xl bg-black/70 border border-emerald-500/30 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-emerald-200/90 mb-1">Total</div>
          <div className="text-2xl font-semibold text-emerald-100">{health.counts.total}</div>
          <p className="mt-1 text-[11px] text-emerald-100/80">Alerts observed in the current window.</p>
        </div>
      </section>

      <section className="max-w-6xl">
        <div className="rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between text-xs text-slate-200">
            <span>Recent alerts</span>
            <span className="text-slate-400">{alerts.length} item(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 text-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-left">Fundraiser</th>
                  <th className="px-3 py-2 text-left">Tx</th>
                  <th className="px-3 py-2 text-left">Message</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Attempts</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                {alerts.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-900/70 transition-colors">
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-200">{String(a._id).slice(-6)}</td>
                    <td className="px-3 py-2 text-xs text-slate-100">{a.level}</td>
                    <td className="px-3 py-2 text-xs text-slate-200">{a.fundraiserTitle ?? a.fundraiserId}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-300">{a.txHash ? String(a.txHash).slice(0, 12) : ''}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-200">{String(a.message ?? '').slice(0, 80)}</td>
                    <td className="px-3 py-2 text-xs text-slate-100">{a.status}</td>
                    <td className="px-3 py-2 text-xs text-slate-100">{a.attempts}</td>
                    <td className="px-3 py-2 text-[10px] text-slate-300">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
