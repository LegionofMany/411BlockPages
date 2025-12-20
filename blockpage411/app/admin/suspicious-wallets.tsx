"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "../components/admin/AdminLayout";
import useAdminWallet from "../hooks/useAdminWallet";

type SuspiciousWallet = {
  address: string;
  suspicionReason?: string;
  suspiciousAt?: string | number | Date;
};

export default function SuspiciousWalletsDashboard() {
  const [wallets, setWallets] = useState<SuspiciousWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname() || "/admin/suspicious-wallets";
  const { adminWallet } = useAdminWallet();
  useEffect(() => {
    async function fetchWallets() {
      setLoading(true);
      const res = await fetch("/api/wallet/suspicious");
      const data = await res.json();
      setWallets(data.wallets || []);
      setLoading(false);
    }
    fetchWallets();
  }, []);
  return (
    <AdminLayout currentPath={pathname} adminWallet={adminWallet}>
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-red-100 mb-1">Suspicious Wallet Monitoring</h2>
        <p className="text-sm text-slate-300/90">
          Review wallets that have triggered risk signals or manual flags. Use this
          list as a starting point for deeper investigation.
        </p>
      </section>

      {loading ? (
        <div className="text-sm text-slate-300">Loading suspicious wallets…</div>
      ) : (
        <section className="max-w-6xl">
          <div className="rounded-3xl border border-red-500/40 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="px-4 py-3 border-b border-red-500/40 flex items-center justify-between text-xs text-slate-200">
              <span>Flagged wallets</span>
              <span className="text-red-200/90">{wallets.length} wallet(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Address</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">Flagged At</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                  {wallets.map((w, i) => (
                    <tr key={i} className="hover:bg-slate-900/70 transition-colors">
                      <td className="px-3 py-2 font-mono text-[10px] text-red-50 break-all">{w.address}</td>
                      <td className="px-3 py-2 text-xs text-red-100">{w.suspicionReason || "Unknown"}</td>
                      <td className="px-3 py-2 text-[10px] text-slate-300">{w.suspiciousAt ? new Date(w.suspiciousAt).toLocaleString() : '-'}</td>
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
