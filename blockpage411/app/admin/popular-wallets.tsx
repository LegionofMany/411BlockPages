"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "../components/admin/AdminLayout";

type PopularWallet = {
  address: string;
  searchCount?: number;
  lastRefreshed?: string | number | Date;
};

export default function PopularWalletsDashboard() {
  const [wallets, setWallets] = useState<PopularWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname() || "/admin/popular-wallets";
  useEffect(() => {
    async function fetchWallets() {
      setLoading(true);
      const res = await fetch("/api/wallet/popular");
      const data = await res.json();
      setWallets(data.wallets || []);
      setLoading(false);
    }
    fetchWallets();
  }, []);
  return (
    <AdminLayout currentPath={pathname} adminWallet="">
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">Trending & Popular Wallets</h2>
        <p className="text-sm text-slate-300/90">
          View wallets with the highest search activity. Use this view to spot
          emerging trends and potential monitoring candidates.
        </p>
      </section>

      {loading ? (
        <div className="text-sm text-slate-300">Loading popular wallets…</div>
      ) : (
        <section className="max-w-6xl">
          <div className="rounded-3xl border border-amber-400/30 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-400/30 flex items-center justify-between text-xs text-slate-200">
              <span>Most searched wallets</span>
              <span className="text-amber-200/90">{wallets.length} wallet(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Address</th>
                    <th className="px-3 py-2 text-left">Search Count</th>
                    <th className="px-3 py-2 text-left">Last Refreshed</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                  {wallets.map((w, i) => (
                    <tr key={i} className="hover:bg-slate-900/70 transition-colors">
                      <td className="px-3 py-2 font-mono text-[10px] text-amber-50 break-all">{w.address}</td>
                      <td className="px-3 py-2 text-xs text-amber-100">{w.searchCount || "-"}</td>
                      <td className="px-3 py-2 text-[10px] text-slate-300">{w.lastRefreshed ? new Date(w.lastRefreshed).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
