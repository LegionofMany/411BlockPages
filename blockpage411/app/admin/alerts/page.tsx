"use client";

import React, { useEffect, useState } from 'react';
import AdminGate from '../../components/admin/AdminGate';
import adminFetch from '../../components/admin/adminFetch';

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

type HealthCounts = { pending: number; failed: number; total: number };

export default function Page() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [health, setHealth] = useState<HealthCounts>({ pending: 0, failed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [alertsRes, healthRes] = await Promise.all([
        adminFetch('/api/admin/alerts'),
        adminFetch('/api/admin/alerts/health'),
      ]);

      if (alertsRes.status === 403 || healthRes.status === 403) {
        setError('Not authorized');
        setAlerts([]);
        setHealth({ pending: 0, failed: 0, total: 0 });
        return;
      }

      if (!alertsRes.ok) throw new Error(`Alerts request failed (${alertsRes.status})`);
      if (!healthRes.ok) throw new Error(`Health request failed (${healthRes.status})`);

      const alertsJson = await alertsRes.json();
      const healthJson = await healthRes.json();
      setAlerts(Array.isArray(alertsJson.alerts) ? alertsJson.alerts : []);
      setHealth(healthJson.counts ?? { pending: 0, failed: 0, total: 0 });
    } catch (e) {
      console.error(e);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function retry() {
    setRetrying(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/alerts/retry');
      const json = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setError('Not authorized');
        return;
      }
      if (!res.ok) {
        setError(json?.error || 'Retry failed');
        return;
      }
      await load();
    } catch (e) {
      console.error(e);
      setError('Retry failed');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <AdminGate title="Admin — Alerts">
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Alerts & Delivery Health</h2>
        <p className="text-sm text-slate-300/90">
          Monitor webhook and fundraising alerts, and keep an eye on failures that
          may affect partners or downstream systems.
        </p>
      </section>

      {error ? (
        <div className="max-w-6xl rounded-3xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="max-w-6xl flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/80 transition-colors disabled:opacity-60"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-amber-500/90 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-60"
          onClick={retry}
          disabled={retrying}
        >
          {retrying ? 'Retrying…' : 'Retry pending/failed'}
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mb-6">
        <div className="rounded-3xl bg-black/70 border border-amber-400/30 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-amber-200/90 mb-1">Pending</div>
          <div className="text-2xl font-semibold text-amber-100">{health.pending}</div>
          <p className="mt-1 text-[11px] text-amber-100/80">Alerts queued for processing.</p>
        </div>
        <div className="rounded-3xl bg-black/70 border border-red-500/40 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-red-200/90 mb-1">Failed</div>
          <div className="text-2xl font-semibold text-red-100">{health.failed}</div>
          <p className="mt-1 text-[11px] text-red-100/80">Alerts that need admin review.</p>
        </div>
        <div className="rounded-3xl bg-black/70 border border-emerald-500/30 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-emerald-200/90 mb-1">Total</div>
          <div className="text-2xl font-semibold text-emerald-100">{health.total}</div>
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
    </AdminGate>
  );
}
