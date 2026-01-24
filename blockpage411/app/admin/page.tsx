"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import AdminWalletsTable from "../components/admin/AdminWalletsTable";
import FlaggedWalletsTable from "../components/admin/FlaggedWalletsTable";
import AuditLogTable from "../components/admin/AuditLogTable";
import FlaggedTransactionsTable from "../components/admin/FlaggedTransactionsTable";
import ContentModerationTable from "../components/admin/ContentModerationTable";
import RecentTransactionsTable from "../components/admin/RecentTransactionsTable";
import SystemSettingsPanel from "../components/admin/SystemSettingsPanel";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import AdminLayout from "../components/admin/AdminLayout";
import useAdminWallet from "../hooks/useAdminWallet";


export default function AdminPage() {
  const { adminWallet, isAdmin, checked } = useAdminWallet();
  const pathname = usePathname() || '/admin';
  // router not used here; admin auth is client+server checked
  // const router = useRouter();

  if (!checked) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-slate-200">Checking admin access...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-amber-50 px-4">
        <div className="max-w-xl w-full rounded-3xl border border-red-500/30 bg-black/70 backdrop-blur-xl p-6">
          <div className="text-xs font-semibold tracking-[0.16em] uppercase text-red-200/90 mb-2">
            Access denied
          </div>
          <h1 className="text-xl font-semibold text-red-100 mb-2">Admin Dashboard</h1>
          <p className="text-sm text-slate-200/90">
            Your wallet address is not recognized as an admin.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-3">
            <div className="text-xs text-slate-400 uppercase tracking-[0.16em]">Current wallet</div>
            <div className="mt-1 font-mono text-xs text-emerald-200 break-all">{adminWallet || "(none)"}</div>
          </div>

          <div className="mt-4 text-xs text-slate-300">
            Admins are controlled by <span className="font-mono">NEXT_PUBLIC_ADMIN_WALLETS</span>. Ensure your wallet is in that list, then set localStorage <span className="font-mono">wallet</span> (or connect via the app) and refresh.
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentPath={pathname} adminWallet={adminWallet}>
      <section className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">
          Overview
        </h2>
        <p className="text-sm text-slate-300/90">
          Quick glance at risk, flags, fundraisers, and admin activity.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-300 mb-3">
          Admin pages
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { href: "/admin/charities", label: "Charities" },
            { href: "/admin/fundraisers", label: "Fundraisers" },
            { href: "/admin/givingblock-donations", label: "Donations" },
            { href: "/admin/kyc-review", label: "KYC" },
            { href: "/admin/risk", label: "Risk" },
            { href: "/admin/reports", label: "Reports" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-100 hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <AdminStatsCards />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactionsTable />
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FlaggedTransactionsTable adminWallet={adminWallet} />
        <FlaggedWalletsTable adminWallet={adminWallet} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentModerationTable />
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100">Admin Activity Log</h3>
          </div>
          <div className="p-4">
            <AuditLogTable adminWallet={adminWallet} />
            <div className="mt-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 p-3 text-[11px] text-slate-300">
              <p className="font-semibold text-slate-100 mb-1">Quick links</p>
              <p className="mb-1">Use the menu/sidebar to jump to charities, fundraisers, risk, and reports.</p>
              <p>Only wallets listed in <span className="font-mono">NEXT_PUBLIC_ADMIN_WALLETS</span> with a valid session can access these tools.</p>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

