"use client";
import React, { useEffect, useState } from "react";
import adminFetch from "../../components/admin/adminFetch";

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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4" style={{ color: "#fefce8" }}>
        Admin KYC Management
      </h1>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {loading ? (
        <div className="text-slate-300">Loading wallets...</div>
      ) : (
        <table className="w-full text-sm border border-slate-700 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="py-2 px-3 text-left">Address</th>
              <th className="py-2 px-3 text-left">Chain</th>
              <th className="py-2 px-3 text-left">KYC Status</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.address + w.chain} className="border-t border-slate-700">
                <td className="py-2 px-3 font-mono">{w.address}</td>
                <td className="py-2 px-3">{w.chain}</td>
                <td className="py-2 px-3">{w.kycStatus || "unverified"}</td>
                <td className="py-2 px-3">
                  {w.kycStatus === "verified" ? (
                    <span className="text-emerald-400">Verified</span>
                  ) : (
                    <button
                      className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold disabled:opacity-60"
                      disabled={verifying === w.address + w.chain}
                      onClick={() => verifyKyc(w.address, w.chain)}
                    >
                      {verifying === w.address + w.chain ? "Verifying..." : "Verify KYC"}
                    </button>
                  )}
                  {logs[w.address] && logs[w.address].length > 0 ? (
                    <div className="text-xs text-slate-400 mt-1">
                      Last action: {logs[w.address][0].action} @ {new Date(logs[w.address][0].createdAt).toLocaleString()}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
