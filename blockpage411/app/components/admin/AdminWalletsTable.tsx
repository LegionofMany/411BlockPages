interface Flag {
  user: string;
  reason: string;
  date: string;
}
import React, { useState, useEffect } from "react";
import adminFetch from "./adminFetch";
import KYCAdminControls from "./KYCAdminControls";
import RoleAdminControls from "./RoleAdminControls";
import KYCDetailsModal from "./KYCDetailsModal";

interface Wallet {
  address: string;
  chain: string;
  kycStatus?: string;
  kycDetails?: Record<string, string> | null;
  role?: string;
  flags?: Flag[];
  blacklisted?: boolean;
}



const AdminWalletsTable: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [blacklisting, setBlacklisting] = useState<string | null>(null);
  const [kycModal, setKycModal] = useState<{ open: boolean; wallet: Wallet | null }>({ open: false, wallet: null });

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/wallets")
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setWallets(data.wallets || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('AdminWallets fetch error', err);
        setError("Failed to load wallets");
        setLoading(false);
      });
  }, []);

  const handleUpdateKYC = (address: string, chain: string, status: string) => {
    setWallets(wallets => wallets.map(ww => (ww.address === address && ww.chain === chain ? { ...ww, kycStatus: status } : ww)));
  };

  const handleUpdateRole = (address: string, chain: string, role: string) => {
    setWallets(wallets => wallets.map(ww => (ww.address === address && ww.chain === chain ? { ...ww, role } : ww)));
  };

  const handleDelete = async (address: string, chain: string) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    setDeleting(`${chain}:${address}`);
    try {
      const res = await adminFetch("/api/admin/delete-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain })
      });
      let body: any = null
      try { body = await res.json() } catch (_) { body = await res.text() }
      if (res.ok) {
        setWallets(wallets => wallets.filter(w => !(w.address === address && w.chain === chain)));
      } else if (res.status === 403) {
        alert('Not authorized — sign in as an admin or set an admin wallet in localStorage')
      } else {
        alert(body?.message || 'Failed to delete account')
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleBlacklist = async (address: string, chain: string, blacklisted: boolean) => {
    setBlacklisting(`${chain}:${address}`);
    try {
      const res = await adminFetch("/api/admin/blacklist-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain, blacklisted: !blacklisted })
      });
      let body: any = null
      try { body = await res.json() } catch (_) { body = await res.text() }
      if (res.ok) {
        setWallets(wallets => wallets.map(w => w.address === address && w.chain === chain ? { ...w, blacklisted: !blacklisted } : w));
      } else if (res.status === 403) {
        alert('Not authorized — sign in as an admin or set an admin wallet in localStorage')
      } else {
        alert(body?.message || 'Failed to update blacklist status')
      }
    } finally {
      setBlacklisting(null);
    }
  };

  return (
    <section className="mb-0">
      <div className="rounded-3xl border border-slate-700/70 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/70 flex items-center justify-between text-xs text-slate-200">
          <span>All wallets</span>
          <span className="text-slate-400">{wallets.length} item(s)</span>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-300">Loading wallets…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 text-slate-200">
                <tr>
                  <th className="py-2 px-3 text-left">Address</th>
                  <th className="py-2 px-3 text-left">Chain</th>
                  <th className="py-2 px-3 text-left">KYC</th>
                  <th className="py-2 px-3 text-left">Role</th>
                  <th className="py-2 px-3 text-left">Flags</th>
                  <th className="py-2 px-3 text-left">Blacklisted</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/60 divide-y divide-slate-800/80">
                {wallets.map((w) => {
                  const key = `${w.chain}:${w.address}`;
                  return (
                    <tr key={key} className="hover:bg-slate-900/70 transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] text-emerald-200 break-all">{w.address}</td>
                      <td className="py-2 px-3 text-slate-200">{w.chain}</td>
                      <td className="py-2 px-3 text-slate-200">
                        <div className="flex flex-col gap-2">
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-flex rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] text-slate-200">
                              {w.kycStatus || "-"}
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-900/70 transition-colors"
                              onClick={() => setKycModal({ open: true, wallet: w })}
                            >
                              View details
                            </button>
                          </div>
                          <KYCAdminControls
                            address={w.address}
                            chain={w.chain}
                            currentStatus={w.kycStatus || ""}
                            onUpdate={(status) => handleUpdateKYC(w.address, w.chain, status)}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-200">
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex w-fit rounded-full border border-slate-600/70 bg-slate-900/40 px-3 py-1 text-[11px] text-slate-200">
                            {w.role || "user"}
                          </span>
                          <RoleAdminControls
                            address={w.address}
                            chain={w.chain}
                            currentRole={w.role || "user"}
                            onUpdate={(role) => handleUpdateRole(w.address, w.chain, role)}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-200">{w.flags?.length || 0}</td>
                      <td className="py-2 px-3 text-slate-200">{w.blacklisted ? "Yes" : "No"}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-60"
                            disabled={deleting === key}
                            onClick={() => handleDelete(w.address, w.chain)}
                          >
                            {deleting === key ? "Deleting…" : "Delete"}
                          </button>
                          <button
                            type="button"
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                              w.blacklisted
                                ? 'bg-amber-500/90 text-black hover:bg-amber-400'
                                : 'border border-slate-600/70 bg-slate-900/40 text-slate-100 hover:bg-slate-900/70'
                            }`}
                            disabled={blacklisting === key}
                            onClick={() => handleBlacklist(w.address, w.chain, !!w.blacklisted)}
                          >
                            {blacklisting === key
                              ? (w.blacklisted ? 'Un-blacklisting…' : 'Blacklisting…')
                              : (w.blacklisted ? 'Un-blacklist' : 'Blacklist')}
                          </button>
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
      <KYCDetailsModal
        isOpen={kycModal.open}
        wallet={kycModal.wallet}
        onClose={() => setKycModal({ open: false, wallet: null })}
      />
    </section>
  );
};

export default AdminWalletsTable;
