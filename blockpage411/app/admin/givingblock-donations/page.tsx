"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "../../components/admin/AdminLayout";

type PledgeRow = {
  _id?: string;
  fundraiserId: string;
  externalId: string;
  amount: number;
  taxAmount?: number;
  currency: string;
  donor?: string;
  status?: string;
  createdAt?: string;
  raw?: { source?: string; payload?: unknown; [key: string]: unknown };
};

export default function AdminGivingBlockDonationsPage() {
  const pathname = usePathname() || "/admin/givingblock-donations";
  const [items, setItems] = useState<PledgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fundraisers/admin/pledges", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const js = (await res.json()) as { ok?: boolean; pledges?: PledgeRow[] };
      const list = (js && js.pledges) || [];
      const gb = list.filter(
        (p) =>
          p &&
          typeof p === "object" &&
          (p.raw as any)?.source === "givingblock"
      );
      setItems(gb);
    } catch (e: any) {
      setError(e?.message || "Failed to load GivingBlock donations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout currentPath={pathname} adminWallet="">
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-100 mb-1">
          Incoming GivingBlock Donations
        </h2>
        <p className="text-sm text-slate-300/90">
          Read-only view of pledges created from verified GivingBlock webhook
          events. Use this to reconcile external donations with internal
          fundraisers.
        </p>
      </section>

      {error && (
        <div className="mb-4 max-w-6xl rounded-3xl border border-red-500/50 bg-red-900/30 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-300">Loading donations…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-300">
          No GivingBlock-sourced donations found yet. Once webhooks are
          configured and live donations flow, they will appear here.
        </div>
      ) : (
        <div className="max-w-6xl rounded-3xl border border-emerald-500/30 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/30">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              {items.length} donations
            </div>
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100 hover:bg-emerald-500/20 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="bg-emerald-950/80 text-[11px] uppercase tracking-[0.16em] text-emerald-200">
                <tr>
                  <th className="px-3 py-2 whitespace-nowrap">Created</th>
                  <th className="px-3 py-2 whitespace-nowrap">Fundraiser</th>
                  <th className="px-3 py-2 whitespace-nowrap">External ID</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">
                    Amount
                  </th>
                  <th className="px-3 py-2 whitespace-nowrap">Currency</th>
                  <th className="px-3 py-2 whitespace-nowrap">Donor</th>
                  <th className="px-3 py-2 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr
                    key={p._id || `${p.fundraiserId}-${p.externalId}`}
                    className="border-t border-emerald-900/60 hover:bg-emerald-900/20"
                  >
                    <td className="px-3 py-2 text-[11px] text-slate-300 whitespace-nowrap">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : "–"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-emerald-100 break-all max-w-xs">
                      {p.fundraiserId}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-200 break-all max-w-xs">
                      {p.externalId}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-emerald-100 whitespace-nowrap">
                      {p.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-200 whitespace-nowrap">
                      {p.currency}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-200 break-all max-w-xs">
                      {p.donor || "–"}
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 border text-[10px] uppercase tracking-[0.16em] ${
                          (p.status || "completed") === "completed"
                            ? "border-emerald-400/70 text-emerald-200 bg-emerald-900/40"
                            : "border-amber-400/70 text-amber-200 bg-amber-900/30"
                        }`}
                      >
                        {p.status || "completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
