"use client";
import React, { useEffect, useState } from "react";

import AdminWalletsTable from "../components/admin/AdminWalletsTable";
import FlaggedWalletsTable from "../components/admin/FlaggedWalletsTable";
import AuditLogTable from "../components/admin/AuditLogTable";
import FlaggedTransactionsTable from "../components/admin/FlaggedTransactionsTable";
import ContentModerationTable from "../components/admin/ContentModerationTable";
import RecentTransactionsTable from "../components/admin/RecentTransactionsTable";
import SystemSettingsPanel from "../components/admin/SystemSettingsPanel";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import { useRouter } from "next/navigation";


export default function AdminPage() {
  const [adminWallet, setAdminWallet] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();


  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wallet = localStorage.getItem("wallet") || "";
      setAdminWallet(wallet);
      const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
        .split(",")
        .map(a => a.toLowerCase().trim());
      console.log("[ADMIN DEBUG] Wallet:", wallet);
      console.log("[ADMIN DEBUG] Admin Wallets:", adminWallets);
      if (wallet && adminWallets.includes(wallet.toLowerCase().trim())) {
        setIsAdmin(true);
        console.log("[ADMIN DEBUG] Access granted");
      } else {
        setIsAdmin(false);
        console.log("[ADMIN DEBUG] Access denied");
      }
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return <div className="text-center py-10 text-cyan-200">Checking admin access...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="mt-32 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-cyan-200 mb-4">Your wallet address is not recognized as an admin.</p>
          <p className="text-cyan-400">Current wallet: <span className="font-mono">{adminWallet || "(none)"}</span></p>
          <p className="text-cyan-400">Allowed admins:</p>
          <ul className="text-cyan-300 font-mono text-sm mt-2">
            {(process.env.NEXT_PUBLIC_ADMIN_WALLETS || "").split(",").map(a => <li key={a}>{a.trim()}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-transparent">
      <main className="flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 mt-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-cyan-300">Admin Dashboard</h1>
          <div className="text-sm text-cyan-200">Signed in as <span className="font-mono ml-2">{adminWallet || '(none)'}</span></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <RecentTransactionsTable />
            </div>

            <div className="card">
              <FlaggedTransactionsTable adminWallet={adminWallet} />
            </div>

            <div className="card">
              <FlaggedWalletsTable adminWallet={adminWallet} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-1 space-y-6">
            <div className="card">
              <AdminStatsCards />
            </div>

            <div className="card">
              <SystemSettingsPanel />
            </div>

            <div className="card">
              <ContentModerationTable />
            </div>

            <div className="card">
              <AdminWalletsTable />
            </div>

            <div className="card">
              <AuditLogTable adminWallet={adminWallet} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

