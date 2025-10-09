"use client";

import React, { useEffect, useState } from 'react';
import adminFetch from './adminFetch';

interface Stats {
  totalWallets: number;
  flaggedTxCount: number;
  flaggedWallets: number;
}

const StatCard: React.FC<{ title: string; value: string | number; hint?: string }> = ({ title, value, hint }) => (
  <div className="rounded-lg bg-gray-900/80 p-4 shadow-xl border border-gray-800">
    <div className="text-sm text-cyan-200">{title}</div>
    <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-cyan-100">{value}</div>
    {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
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
      <div className="grid grid-cols-1 gap-3">
        <div className="animate-pulse bg-gray-800 rounded-lg h-20" />
        <div className="animate-pulse bg-gray-800 rounded-lg h-20" />
        <div className="animate-pulse bg-gray-800 rounded-lg h-20" />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="text-red-400">{error || 'No stats available'}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <StatCard title="Total Wallets" value={stats.totalWallets} hint="All wallets in DB" />
      <StatCard title="Flagged Transactions" value={stats.flaggedTxCount} hint="Transactions marked as suspicious" />
      <StatCard title="Flagged Wallets" value={stats.flaggedWallets} hint="Wallets with flags or blacklisted" />
    </div>
  );
};

export default AdminStatsCards;
