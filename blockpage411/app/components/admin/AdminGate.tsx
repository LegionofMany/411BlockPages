"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "./AdminLayout";
import useAdminWallet from "../../hooks/useAdminWallet";

export default function AdminGate({
  children,
  currentPath,
  title = "Admin",
}: {
  children: React.ReactNode;
  currentPath?: string;
  title?: string;
}) {
  const pathname = usePathname() || currentPath || "/admin";
  const { adminWallet, isAdmin, checked } = useAdminWallet();

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-slate-200">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-amber-50 px-4">
        <div className="max-w-xl w-full rounded-3xl border border-red-500/30 bg-black/70 backdrop-blur-xl p-6">
          <div className="text-xs font-semibold tracking-[0.16em] uppercase text-red-200/90 mb-2">
            Access denied
          </div>
          <h1 className="text-xl font-semibold text-red-100 mb-2">{title}</h1>
          <p className="text-sm text-slate-200/90">
            Your wallet address is not recognized as an admin.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-3">
            <div className="text-xs text-slate-400 uppercase tracking-[0.16em]">Current wallet</div>
            <div className="mt-1 font-mono text-xs text-emerald-200 break-all">
              {adminWallet || "(none)"}
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-300">
            Admins are controlled by <span className="font-mono">NEXT_PUBLIC_ADMIN_WALLETS</span>. Set your wallet in localStorage as <span className="font-mono">wallet</span> (or connect via the app), then refresh.
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentPath={pathname} adminWallet={adminWallet}>
      {children}
    </AdminLayout>
  );
}
