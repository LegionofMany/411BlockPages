"use client";
import React, { useEffect, useState } from "react";

import AdminWalletsTable from "../components/admin/AdminWalletsTable";
import KYCDetailsModal from "../components/admin/KYCDetailsModal";
import FlaggedWalletsTable from "../components/admin/FlaggedWalletsTable";
import AuditLogTable from "../components/admin/AuditLogTable";
import FlaggedTransactionsTable from "../components/admin/FlaggedTransactionsTable";
import ContentModerationTable from "../components/admin/ContentModerationTable";
import RecentTransactionsTable from "../components/admin/RecentTransactionsTable";
import SystemSettingsPanel from "../components/admin/SystemSettingsPanel";
import KYCAdminControls from "../components/admin/KYCAdminControls";
import RoleAdminControls from "../components/admin/RoleAdminControls";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";


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
        <Navbar variant="admin" />
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
    <div className="min-h-screen flex flex-col items-center">
      <Navbar variant="admin" />
      <main className="flex-1 w-full max-w-5xl px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold text-cyan-300 mb-8">Admin Dashboard</h1>
        <SystemSettingsPanel />
        <ContentModerationTable />
        <RecentTransactionsTable />
        <FlaggedTransactionsTable adminWallet={adminWallet} />
        <FlaggedWalletsTable adminWallet={adminWallet} />
        <AdminWalletsTable />
        <AuditLogTable adminWallet={adminWallet} />
      </main>
    </div>
  );
}

