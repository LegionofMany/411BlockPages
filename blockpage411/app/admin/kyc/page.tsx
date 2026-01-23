"use client";
import React, { useEffect, useState } from "react";
import adminFetch from "../../components/admin/adminFetch";
import AdminGate from "../../components/admin/AdminGate";

interface Wallet {
  address: string;
  chain: string;
  kycStatus?: string;
  kycRequestedAt?: string;
  kycVerifiedAt?: string;
}

export default function AdminKycPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch("/api/admin/wallets");
        const data = await res.json();
        setWallets(data.results || []);
        // fetch recent audit logs
        try {
          const logsRes = await adminFetch('/api/admin/kyc-logs');
          const logsJson = await logsRes.json();
          const grouped: Record<string, any[]> = {};
          (logsJson.results || []).forEach((l: any) => {
            const key = String(l.target || '');
            grouped[key] = grouped[key] || [];
            grouped[key].push(l);
          });
          setLogs(grouped);
        } catch (err) {
          // ignore logs fetch errors
        }
      } catch (e: any) {
        setError(e.message || "Failed to load wallets");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function verifyKyc(address: string, chain: string) {
    setVerifying(address + chain);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/kyc-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain, kycStatus: "verified" }),
      });
      if (!res.ok) throw new Error("Failed to verify KYC");
      setWallets((prev) =>
        prev.map((w) =>
          w.address === address && w.chain === chain
            ? { ...w, kycStatus: "verified", kycVerifiedAt: new Date().toISOString() }
            : w
        )
      );
    } catch (e: any) {
      setError(e.message || "Failed to verify KYC");
    } finally {
      setVerifying(null);
    }
  }

  return (
    <AdminGate title="Admin — KYC">
      <section className="max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-amber-100 mb-1">KYC Management</h2>
        <p className="text-sm text-slate-300/90">
          Review and update KYC status for wallets.
        </p>
      </section>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      {loading ? (
        <div className="text-sm text-slate-300">Loading wallets...</div>
      ) : (
        <section className="max-w-6xl rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between text-xs text-slate-200">
            <span>Wallets</span>
            <span className="text-slate-400">{wallets.length} item(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 text-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left">Address</th>
                  <th className="py-2 px-3 text-left">Chain</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                {wallets.map((w) => (
                  <tr key={w.address + w.chain} className="hover:bg-slate-900/70 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-100 break-all">{w.address}</td>
                    <td className="py-2 px-3 text-slate-200">{w.chain}</td>
                    <td className="py-2 px-3 text-slate-200">{w.kycStatus || "unverified"}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-1">
                        <div>
                          {w.kycStatus === "verified" ? (
                            <span className="text-emerald-300">Verified</span>
                          ) : (
                            <button
                              className="inline-flex items-center rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-60"
                              disabled={verifying === w.address + w.chain}
                              onClick={() => verifyKyc(w.address, w.chain)}
                            >
                              {verifying === w.address + w.chain ? "Verifying..." : "Verify KYC"}
                            </button>
                          )}
                        </div>
                        {logs[w.address] && logs[w.address].length > 0 ? (
                          <div className="text-[11px] text-slate-400">
                            Last action: {logs[w.address][0].action} @ {new Date(logs[w.address][0].createdAt).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminGate>
  );
}
