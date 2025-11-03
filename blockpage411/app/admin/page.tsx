"use client";
import React, { useEffect, useState } from "react";
import { getAddress } from 'ethers';

import AdminWalletsTable from "../components/admin/AdminWalletsTable";
import FlaggedWalletsTable from "../components/admin/FlaggedWalletsTable";
import AuditLogTable from "../components/admin/AuditLogTable";
import FlaggedTransactionsTable from "../components/admin/FlaggedTransactionsTable";
import ContentModerationTable from "../components/admin/ContentModerationTable";
import RecentTransactionsTable from "../components/admin/RecentTransactionsTable";
import SystemSettingsPanel from "../components/admin/SystemSettingsPanel";
import AdminStatsCards from "../components/admin/AdminStatsCards";
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

      console.log("[ADMIN DEBUG] Wallet:", wallet);
      console.log("[ADMIN DEBUG] Admin Wallets:", adminWallets);

      if (wallet && adminWallets.map(a => (a || "").toLowerCase().trim()).includes((wallet || "").toLowerCase().trim())) {
        setIsAdmin(true);
        console.log("[ADMIN DEBUG] Access granted");
      } else {
        setIsAdmin(false);
        console.log("[ADMIN DEBUG] Access denied");
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
            console.log('[ADMIN DEBUG] Server-side access granted for', body.address);
          } else {
            // only set false if server explicitly says not admin
            setIsAdmin(false);
            console.log('[ADMIN DEBUG] Server-side access denied', body && body.allowed ? body.allowed : 'no-list');
          }
          // if server responded we can trust its decision
          setChecked(true);
        } else {
          console.log('[ADMIN DEBUG] Server admin check failed', res.status);
        }
      } catch (err) {
        console.warn('[ADMIN DEBUG] Server admin check error', err);
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

