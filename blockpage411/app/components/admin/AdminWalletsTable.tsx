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
    setDeleting(address);
    try {
      const res = await fetch("/api/admin/delete-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain })
      });
      if (res.ok) {
        setWallets(wallets => wallets.filter(w => !(w.address === address && w.chain === chain)));
      } else {
        alert("Failed to delete account");
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleBlacklist = async (address: string, chain: string, blacklisted: boolean) => {
    setBlacklisting(address);
    try {
      const res = await fetch("/api/admin/blacklist-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain, blacklisted: !blacklisted })
      });
      if (res.ok) {
        setWallets(wallets => wallets.map(w => w.address === address && w.chain === chain ? { ...w, blacklisted: !blacklisted } : w));
      } else {
        alert("Failed to update blacklist status");
      }
    } finally {
      setBlacklisting(null);
    }
  };

  return (
    <section className="mb-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-cyan-200">All Wallets</h2>
      </div>
      {loading ? (
        <div className="text-cyan-200">Loading wallets...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="-mx-4 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-xl shadow-xl">
            <thead>
              <tr className="bg-blue-900 text-cyan-200">
                <th className="py-2 px-4">Address</th>
                <th className="py-2 px-4">Chain</th>
                <th className="py-2 px-4">KYC</th>
                <th className="py-2 px-4">Flags</th>
                <th className="py-2 px-4">Blacklisted</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map(w => (
                <tr key={w.address + w.chain} className="border-b border-blue-800 hover:bg-blue-950">
                  <td className="py-2 px-4 font-mono text-green-300">{w.address}</td>
                  <td className="py-2 px-4 text-cyan-200">{w.chain}</td>
                  <td className="py-2 px-4 text-cyan-100">
                    <span>{w.kycStatus || "-"}</span>
                    <KYCAdminControls address={w.address} chain={w.chain} currentStatus={w.kycStatus || ""} onUpdate={status => handleUpdateKYC(w.address, w.chain, status)} />
                    <button
                      className="ml-2 px-2 py-0.5 rounded bg-cyan-800 text-white text-xs font-bold hover:bg-cyan-900"
                      onClick={() => setKycModal({ open: true, wallet: w })}
                    >View KYC Details</button>
                  </td>
                  <td className="py-2 px-4 text-blue-200">
                    <span>{w.role || "user"}</span>
                    <RoleAdminControls address={w.address} chain={w.chain} currentRole={w.role || "user"} onUpdate={role => handleUpdateRole(w.address, w.chain, role)} />
                  </td>
                  <td className="py-2 px-4 text-yellow-200">{w.flags?.length || 0}</td>
                  <td className="py-2 px-4 text-red-400">{w.blacklisted ? "Yes" : "No"}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded disabled:opacity-60"
                      disabled={deleting === w.address}
                      onClick={() => handleDelete(w.address, w.chain)}
                    >
                      {deleting === w.address ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      className={`py-1 px-3 rounded font-bold disabled:opacity-60 ${w.blacklisted ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-700 hover:bg-green-700 text-green-200'}`}
                      disabled={blacklisting === w.address}
                      onClick={() => handleBlacklist(w.address, w.chain, w.blacklisted!)}
                    >
                      {blacklisting === w.address
                        ? (w.blacklisted ? 'Un-blacklisting...' : 'Blacklisting...')
                        : (w.blacklisted ? 'Un-blacklist' : 'Blacklist')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      <KYCDetailsModal
        isOpen={kycModal.open}
        wallet={kycModal.wallet}
        onClose={() => setKycModal({ open: false, wallet: null })}
      />
    </section>
  );
};

export default AdminWalletsTable;
