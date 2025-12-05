"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import RiskBadge from "../../../components/RiskBadge";
import AdminLayout from "../../components/admin/AdminLayout";

type RiskCategory = "green" | "yellow" | "red";

interface AdminRiskWallet {
  address: string;
  chain: string;
  riskScore: number;
  riskCategory: RiskCategory | null;
  blacklisted?: boolean;
  suspicious?: boolean;
  trustScore?: number;
}

export default function AdminRiskPage() {
  const [wallets, setWallets] = useState<AdminRiskWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const pathname = usePathname() || "/admin/risk";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/risk-wallets");
        if (!res.ok) {
          throw new Error(`Failed to load wallets (${res.status})`);
        }
        const data = await res.json();
        setWallets(data.wallets || []);
      } catch (err) {
        setError((err as Error).message || "Failed to load wallets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleOverride(address: string, chain: string, formData: FormData) {
    const rawScore = formData.get("riskScore") as string;
    const rawCategory = formData.get("riskCategory") as string;
    const score = rawScore ? Number(rawScore) : undefined;
    const category = rawCategory || undefined;

    try {
      setSaving(`${chain}:${address}`);
      const res = await fetch("/api/admin/risk-wallets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain, riskScore: score, riskCategory: category }),
      });
      if (!res.ok) {
        throw new Error(`Failed to save override (${res.status})`);
      }
      const updated = await res.json();
      setWallets(prev =>
        prev.map(w =>
          w.address === address && w.chain === chain
            ? { ...w, riskScore: updated.riskScore, riskCategory: updated.riskCategory as RiskCategory }
            : w
        )
      );
    } catch (err) {
      alert((err as Error).message || "Failed to save override");
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminLayout currentPath={pathname} adminWallet={""}>
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">
          Wallet Risk Overrides
        </h2>
        <p className="text-sm text-slate-300/90">
          Review wallets with elevated risk and manually adjust scores or categories where needed.
        </p>
      </section>

      {loading && (
        <div className="mt-10 text-cyan-200 text-sm">Loading high-risk wallets...</div>
      )}

      {error && !loading && (
        <div className="mt-10 rounded-3xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm max-w-6xl">
          <p className="font-semibold text-red-200 mb-1">Failed to load high-risk wallets</p>
          <p className="text-red-100/90">{error}</p>
        </div>
      )}

      {!loading && !error && wallets.length === 0 && (
        <div className="mt-10 text-sm text-emerald-200 max-w-6xl">
          No high-risk wallets found above the current threshold.
        </div>
      )}

      {!loading && !error && wallets.length > 0 && (
        <div className="rounded-3xl border border-emerald-500/25 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden max-w-6xl">
          <div className="px-4 py-3 border-b border-emerald-500/20 flex items-center justify-between text-xs text-slate-200">
            <span>High-risk wallets surfaced by the scoring engine</span>
            <span className="text-emerald-200/90">{wallets.length} wallet(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/90 text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">Wallet</th>
                  <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">Risk</th>
                  <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">Flags</th>
                  <th className="px-3 py-2 text-left font-semibold text-emerald-200/90">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                {wallets.map(w => {
                  const key = `${w.chain}:${w.address}`;
                  return (
                    <tr key={key} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-3 py-2 align-top">
                        <div className="font-mono text-xs text-cyan-100 break-all">{w.address}</div>
                        <div className="text-[11px] uppercase tracking-wide text-cyan-300/80 mt-1">{w.chain}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <RiskBadge score={w.riskScore} category={w.riskCategory as RiskCategory} />
                          <span className="text-xs text-cyan-200/80">{Math.round(w.riskScore)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-cyan-200/80">
                        <div>Blacklisted: {w.blacklisted ? "Yes" : "No"}</div>
                        <div>Suspicious: {w.suspicious ? "Yes" : "No"}</div>
                        {typeof w.trustScore === "number" && (
                          <div>Trust score: {w.trustScore}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <form
                          className="flex flex-col gap-2 text-xs text-cyan-100"
                          action={formData => handleOverride(w.address, w.chain, formData)}
                        >
                          <div className="flex gap-2">
                            <input
                              name="riskScore"
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={Math.round(w.riskScore)}
                              className="w-20 rounded border border-cyan-700/70 bg-slate-900/80 px-2 py-1 text-xs text-cyan-100"
                            />
                            <select
                              name="riskCategory"
                              defaultValue={w.riskCategory ?? ''}
                              className="rounded border border-cyan-700/70 bg-slate-900/80 px-2 py-1 text-xs text-cyan-100"
                            >
                              <option value="">Auto</option>
                              <option value="green">Green</option>
                              <option value="yellow">Yellow</option>
                              <option value="red">Red</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            disabled={saving === key}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950 hover:bg-emerald-400/90 disabled:opacity-60 transition-colors"
                          >
                            {saving === key ? "Saving..." : "Save"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
