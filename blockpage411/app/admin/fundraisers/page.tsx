"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "../../components/admin/AdminLayout";
import useAdminWallet from "../../hooks/useAdminWallet";

interface Fundraiser {
  id: string;
  title: string;
  description?: string;
  target?: number;
  raised?: number;
  currency?: string;
  walletAddress?: string;
  owner?: string;
  createdAt?: string | Date;
  expiresAt?: string | Date;
  status?: string;
  active?: boolean;
}

export default function AdminFundraisersPage() {
  const pathname = usePathname() || "/admin/fundraisers";
  const { adminWallet } = useAdminWallet();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadFundraisers(selectedStatus?: string) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const status = selectedStatus ?? statusFilter;
      if (status) params.set("status", status);
      const res = await fetch(`/api/fundraisers/admin?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setError("Failed to load admin fundraisers");
        setFundraisers([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setFundraisers(data.fundraisers || []);
      setError(null);
      setLoading(false);
    } catch (e) {
      setError("Network error while loading fundraisers");
      setFundraisers([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFundraisers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function performAction(id: string, action: "approve" | "flag" | "close") {
    try {
      setActionLoadingId(id);
      const res = await fetch("/api/fundraisers/admin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        alert("Action failed");
      } else {
        await loadFundraisers();
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoadingId(null);
    }
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    loadFundraisers(value);
  };

  return (
    <AdminLayout currentPath={pathname} adminWallet={adminWallet}>
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-100 mb-1">
          Fundraisers Admin
        </h2>
        <p className="text-sm text-slate-300/90">
          Review, approve, flag, or close on-chain fundraising campaigns. This
          view uses the admin-only fundraisers API and is restricted to admins.
        </p>
      </section>

      <section className="mb-4 max-w-6xl flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-300/90">Filter by status:</span>
        <div className="inline-flex rounded-full bg-black/60 border border-slate-600/70 overflow-hidden text-[11px]">
          {[
            ["", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["flagged", "Flagged"],
            ["closed", "Closed"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStatusChange(value)}
              className={`px-3 py-1.5 border-r border-slate-700/60 last:border-r-0 transition-colors ${
                statusFilter === value
                  ? "bg-emerald-500/90 text-black"
                  : "text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="text-sm text-slate-300">Loading fundraisers…</div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : (
        <section className="max-w-6xl">
          <div className="rounded-3xl border border-emerald-500/40 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-500/40 flex items-center justify-between text-xs text-slate-200">
              <span>Fundraisers ({statusFilter || "all"})</span>
              <span className="text-emerald-200/90">
                {fundraisers.length} campaign(s)
              </span>
            </div>
            {fundraisers.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">
                No fundraisers found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-900/80 text-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Title</th>
                      <th className="px-3 py-2 text-left">Wallet</th>
                      <th className="px-3 py-2 text-left">Target / Raised</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Created</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                    {fundraisers.map((f) => {
                      const created = f.createdAt
                        ? new Date(f.createdAt).toLocaleString()
                        : "-";
                      const amount = `${f.raised ?? 0}/${f.target ?? 0} ${
                        f.currency || ""
                      }`;
                      return (
                        <tr
                          key={f.id}
                          className="hover:bg-slate-900/70 transition-colors"
                        >
                          <td className="px-3 py-2 text-[11px] text-slate-50 max-w-[180px] truncate">
                            {f.title}
                          </td>
                          <td className="px-3 py-2 text-[10px] font-mono text-slate-200 max-w-[220px] break-all">
                            {f.walletAddress || "-"}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-emerald-200">
                            {amount}
                          </td>
                          <td className="px-3 py-2 text-[11px]">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                f.status === "approved"
                                  ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/50"
                                  : f.status === "pending"
                                  ? "bg-amber-500/10 text-amber-200 border border-amber-500/50"
                                  : f.status === "flagged"
                                  ? "bg-red-500/15 text-red-200 border border-red-500/50"
                                  : f.status === "closed"
                                  ? "bg-slate-700/40 text-slate-200 border border-slate-500/60"
                                  : "bg-slate-800/60 text-slate-200 border border-slate-600/60"
                              }`}
                            >
                              {f.status || "unknown"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[10px] text-slate-300">
                            {created}
                          </td>
                          <td className="px-3 py-2 text-[10px] text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {f.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() => performAction(f.id, "approve")}
                                  disabled={actionLoadingId === f.id}
                                  className="rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-black px-2.5 py-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Approve
                                </button>
                              )}
                              {f.status !== "flagged" && (
                                <button
                                  type="button"
                                  onClick={() => performAction(f.id, "flag")}
                                  disabled={actionLoadingId === f.id}
                                  className="rounded-full bg-amber-500/90 hover:bg-amber-400 text-black px-2.5 py-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Flag
                                </button>
                              )}
                              {f.status !== "closed" && (
                                <button
                                  type="button"
                                  onClick={() => performAction(f.id, "close")}
                                  disabled={actionLoadingId === f.id}
                                  className="rounded-full bg-slate-700 hover:bg-slate-600 text-slate-50 px-2.5 py-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Close
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
