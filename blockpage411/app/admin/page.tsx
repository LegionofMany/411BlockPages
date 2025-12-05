"use client";
import React, { useEffect, useState } from "react";
import { getAddress } from 'ethers';
import { usePathname } from "next/navigation";

import AdminWalletsTable from "../components/admin/AdminWalletsTable";
import FlaggedWalletsTable from "../components/admin/FlaggedWalletsTable";
import AuditLogTable from "../components/admin/AuditLogTable";
import FlaggedTransactionsTable from "../components/admin/FlaggedTransactionsTable";
import ContentModerationTable from "../components/admin/ContentModerationTable";
import RecentTransactionsTable from "../components/admin/RecentTransactionsTable";
import SystemSettingsPanel from "../components/admin/SystemSettingsPanel";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import AdminLayout from "../components/admin/AdminLayout";
// local minimal Ethereum provider shape for typings
type EthereumProvider = {
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  request?: (...args: unknown[]) => Promise<unknown>;
};


export default function AdminPage() {
  const [adminWallet, setAdminWallet] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checked, setChecked] = useState(false);
  const pathname = usePathname() || '/admin';
  // router not used here; admin auth is client+server checked
  // const router = useRouter();

  useEffect(() => {
    // central check function so we can re-run on events
    function checkAdmin() {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("wallet") || "";
      let wallet = raw;
      // normalize using ethers to ensure checksummed form; fall back to raw lowercase
      try {
        wallet = getAddress(raw || "");
      } catch {
        wallet = (raw || "").toLowerCase().trim();
      }
      setAdminWallet(wallet || "");

      const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
        .split(",")
        .map(a => {
          try { return getAddress(a); } catch { return a.toLowerCase().trim(); }
        });

      if (wallet && adminWallets.map(a => (a || "").toLowerCase().trim()).includes((wallet || "").toLowerCase().trim())) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setChecked(true);
    }

    checkAdmin();

    // also verify server-side JWT session so client cannot spoof admin by writing localStorage
    async function checkServerAdmin() {
      try {
        const res = await fetch('/api/admin/check');
        if (res.ok) {
          const body = await res.json();
          if (body && body.isAdmin) {
            setIsAdmin(true);
          } else {
            // only set false if server explicitly says not admin
            setIsAdmin(false);
          }
          // if server responded we can trust its decision
          setChecked(true);
        } else {
          // non-ok response; leave client-side result in place
        }
      } catch (err) {
        // ignore network errors; fall back to client-side check
      }
    }
    checkServerAdmin();

    // react to localStorage changes (other tabs or code writing to localStorage)
    function onStorage(e: StorageEvent) {
      if (!e.key || e.key === 'wallet') checkAdmin();
    }
    window.addEventListener('storage', onStorage);

  // react to injected provider account changes
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    function onAccountsChanged(...args: unknown[]) {
      // injected provider may call with (accounts) or other shapes; normalize safely
      const maybe = args[0];
      const accounts = Array.isArray(maybe) ? (maybe as string[]) : [];
      // if accounts array empty, clear; else take first
      if (!accounts || accounts.length === 0) {
        localStorage.removeItem('wallet');
      } else {
        // store normalized address
        try { localStorage.setItem('wallet', getAddress(accounts[0])); }
        catch { localStorage.setItem('wallet', accounts[0].toLowerCase()); }
      }
      checkAdmin();
    }

    if (eth && eth.on) {
      eth.on('accountsChanged', onAccountsChanged);
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      if (eth && eth.removeListener) eth.removeListener('accountsChanged', onAccountsChanged);
    };
  }, []);

  if (!checked) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-200">Checking admin access...</div>;
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
          <div className="mt-6 bg-slate-800/50 p-4 rounded text-sm text-cyan-200">
            <strong className="text-cyan-100">How to become an admin</strong>
            <p className="mt-2">Add your wallet address to the <span className="font-mono">NEXT_PUBLIC_ADMIN_WALLETS</span> environment variable (comma-separated), restart the server, and sign in using the Connect → Verify flow so the server issues a session cookie.</p>
            <p className="mt-2">This page uses a server-side JWT session for auth — setting localStorage alone will not grant admin access.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-3xl bg-black/70 border border-emerald-500/25 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <AdminStatsCards />
        </div>
        <div className="rounded-3xl bg-black/70 border border-amber-400/25 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-amber-100 mb-3">Recent Transactions</h3>
          <RecentTransactionsTable />
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-3xl bg-black/70 border border-emerald-500/25 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <h3 className="text-sm font-semibold text-emerald-200 mb-3">Flagged Transactions</h3>
          <FlaggedTransactionsTable adminWallet={adminWallet} />
        </div>
        <div className="rounded-3xl bg-black/70 border border-emerald-500/25 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <h3 className="text-sm font-semibold text-emerald-200 mb-3">Flagged Wallets</h3>
          <FlaggedWalletsTable adminWallet={adminWallet} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-black/70 border border-slate-600/40 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Content Moderation</h3>
          <ContentModerationTable />
        </div>
        <div className="rounded-3xl bg-black/70 border border-slate-600/40 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Admin Activity Log</h3>
          <AuditLogTable adminWallet={adminWallet} />
          <div className="mt-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 p-3 text-[11px] text-slate-300">
            <p className="font-semibold text-slate-100 mb-1">Quick links</p>
            <p className="mb-1">Use the sidebar to jump to charities, fundraisers, risk, and reports.</p>
            <p>Only wallets listed in <span className="font-mono">NEXT_PUBLIC_ADMIN_WALLETS</span> with a valid session can access these tools.</p>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

