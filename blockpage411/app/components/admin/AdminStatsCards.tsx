"use client";

import React, { useEffect, useState } from 'react';
import adminFetch from './adminFetch';

interface Stats {
  totalWallets: number;
  flaggedTxCount: number;
  flaggedWallets: number;
}

const StatCard: React.FC<{ title: string; value: string | number; hint?: string }> = ({ title, value, hint }) => (
  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
    <div className="text-xs uppercase tracking-[0.16em] text-white/60">{title}</div>
    <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-100">{value}</div>
    {hint && <div className="text-xs text-white/55 mt-1">{hint}</div>}
  </div>
);

const AdminStatsCards: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminFetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('AdminStatsCards fetch error', err);
        setError('Failed to load stats');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <div className="text-base sm:text-lg font-semibold text-slate-100">Stats</div>
        </div>
        <div className="p-4 grid grid-cols-1 gap-3">
          <div className="animate-pulse bg-white/10 rounded-xl h-20" />
          <div className="animate-pulse bg-white/10 rounded-xl h-20" />
          <div className="animate-pulse bg-white/10 rounded-xl h-20" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <div className="text-red-400">{error || 'No stats available'}</div>;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-base sm:text-lg font-semibold text-slate-100">Stats</div>
      </div>
      <div className="p-4 grid grid-cols-1 gap-3">
        <StatCard title="Total Wallets" value={stats.totalWallets} hint="All wallets in DB" />
        <StatCard title="Flagged Transactions" value={stats.flaggedTxCount} hint="Transactions marked as suspicious" />
        <StatCard title="Flagged Wallets" value={stats.flaggedWallets} hint="Wallets with flags or blacklisted" />
      </div>
    </div>
  );
};

export default AdminStatsCards;
