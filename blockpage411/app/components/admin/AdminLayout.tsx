"use client";
import React from "react";
import Link from "next/link";
import adminFetch from "./adminFetch";

const adminNav: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/charities", label: "Charities" },
  { href: "/admin/fundraisers", label: "Fundraisers" },
  { href: "/admin/givingblock-donations", label: "GivingBlock Donations" },
  { href: "/admin/kyc", label: "KYC" },
  { href: "/admin/kyc-review", label: "KYC Review" },
  { href: "/admin/risk", label: "Wallet Risk Scores" },
  { href: "/admin/alerts", label: "Flags / Reports" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/appeals", label: "Appeals" },
  { href: "/admin/popular-wallets", label: "Trending Wallets" },
  { href: "/admin/suspicious-wallets", label: "Suspicious Wallets" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/provider-stats", label: "Provider Stats" },
  { href: "/admin-actions", label: "Admin Actions" },
];

export default function AdminLayout({
  children,
  currentPath,
  adminWallet,
}: {
  children: React.ReactNode;
  currentPath: string;
  adminWallet: string;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [kycPending, setKycPending] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await adminFetch('/api/admin/analytics');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && typeof data.kycPending === 'number') setKycPending(data.kycPending);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    // Close the mobile drawer on navigation
    setMobileOpen(false);
  }, [currentPath]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mobileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-slate-950 to-black text-amber-50">
      {/* Mobile drawer */}
      <div
        className={
          mobileOpen
            ? 'fixed inset-0 z-40 md:hidden'
            : 'hidden'
        }
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/70"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-emerald-500/20 bg-black/90 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-xs font-semibold tracking-[0.16em] uppercase text-emerald-200">
              Admin
            </span>
            <button
              type="button"
              className="text-emerald-300 text-xs rounded-full border border-emerald-400/40 px-2 py-1 hover:bg-emerald-500/10 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-4">
            <ul className="space-y-1">
              {adminNav.map((item) => {
                const active =
                  currentPath === item.href ||
                  currentPath.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/60 shadow-[0_12px_30px_rgba(16,185,129,0.45)]"
                          : "text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-100"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.href === '/admin/kyc-review' && kycPending > 0 ? (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-slate-900">{kycPending}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="px-4 py-3 border-t border-emerald-500/20 text-[11px] text-slate-300 bg-black/80">
            <div className="uppercase tracking-[0.16em] text-slate-400 mb-1">Signed in</div>
            <div className="font-mono break-all text-emerald-200">{adminWallet || "(none)"}</div>
          </div>
        </aside>
      </div>

      {/* Sidebar */}
      <aside
        className={`hidden md:flex transition-all duration-200 border-r border-emerald-500/20 bg-black/70 backdrop-blur-xl ${
          collapsed ? "w-16" : "w-64"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed && (
            <span className="text-xs font-semibold tracking-[0.16em] uppercase text-emerald-200">
              Admin
            </span>
          )}
          <button
            type="button"
            className="text-emerald-300 text-xs rounded-full border border-emerald-400/40 px-1.5 py-0.5 hover:bg-emerald-500/10 transition-colors"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          <ul className="space-y-1">
            {adminNav.map((item) => {
              const active =
                currentPath === item.href ||
                currentPath.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/60 shadow-[0_12px_30px_rgba(16,185,129,0.45)]"
                        : "text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-100"
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.href === '/admin/kyc-review' && kycPending > 0 ? (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-slate-900">{kycPending}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {!collapsed && (
          <div className="px-4 py-3 border-t border-emerald-500/20 text-[11px] text-slate-300 bg-black/80">
            <div className="uppercase tracking-[0.16em] text-slate-400 mb-1">
              Signed in
            </div>
            <div className="font-mono break-all text-emerald-200">
              {adminWallet || "(none)"}
            </div>
          </div>
        )}
      </aside>

      {/* Main column with sticky topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-black/85 backdrop-blur-xl border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between">
          <h1 className="text-sm md:text-base font-semibold text-amber-100 tracking-[0.18em] uppercase">
            Blockpage411 Admin
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100 hover:bg-emerald-500/20 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              Menu
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100 hover:bg-emerald-500/20 transition-colors"
            >
              ← Dashboard
            </Link>
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="hidden sm:inline">Wallet:</span>
              <span className="font-mono text-emerald-200 max-w-xs truncate">
                {adminWallet || "not connected"}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 space-y-8">{children}</main>
      </div>
    </div>
  );
}
