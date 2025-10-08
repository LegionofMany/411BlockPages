
import { useEffect, useState } from "react";

interface Flag {
  user: string;
  reason: string;
  date: string;
}

interface FlaggedWallet {
  address: string;
  chain: string;
  flags: Flag[];
}

interface FlaggedWalletsTableProps {
  adminWallet: string;
}

const FlaggedWalletsTable: React.FC<FlaggedWalletsTableProps> = ({ adminWallet }) => {
  const [flaggedWallets, setFlaggedWallets] = useState<FlaggedWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminWallet) return;
    setLoading(true);
    setError(null);
    fetch("/api/admin/flagged-wallets", {
      headers: { "x-admin-address": adminWallet }
    })
      .then(res => res.json())
      .then(data => {
        setFlaggedWallets(data.flaggedWallets || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load flagged wallets");
        setLoading(false);
      });
  }, [adminWallet]);

  const handleDismiss = async (address: string, chain: string, flagIndex: number) => {
    const res = await fetch("/api/admin/dismiss-wallet-flag", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-address": adminWallet
      },
      body: JSON.stringify({ address, chain, flagIndex })
    });
    if (res.ok) {
  setFlaggedWallets(prev => prev.map(ww => ww.address === address && ww.chain === chain ? { ...ww, flags: ww.flags.filter((_: Flag, idx: number) => idx !== flagIndex) } : ww).filter(ww => ww.flags.length > 0));
    }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold text-yellow-300 mb-4">Flagged Wallets</h2>
      {loading ? (
        <div className="text-yellow-200">Loading flagged wallets...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : flaggedWallets.length === 0 ? (
        <div className="text-yellow-200">No flagged wallets found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 rounded-xl shadow-xl">
            <thead>
              <tr className="bg-yellow-900 text-yellow-200">
                <th className="py-2 px-4">Address</th>
                <th className="py-2 px-4">Chain</th>
                <th className="py-2 px-4"># Flags</th>
                <th className="py-2 px-4">Flag Details</th>
              </tr>
            </thead>
            <tbody>
              {flaggedWallets.map(w => (
                <tr key={w.address + w.chain} className="border-b border-yellow-800 hover:bg-yellow-950">
                  <td className="py-2 px-4 font-mono text-yellow-300">{w.address}</td>
                  <td className="py-2 px-4 text-yellow-200">{w.chain}</td>
                  <td className="py-2 px-4 text-yellow-100">{w.flags.length}</td>
                  <td className="py-2 px-4">
                    <ul className="list-disc pl-4 space-y-1">
                      {w.flags.map((f, i) => (
                        <li key={i} className="text-yellow-100 text-sm flex items-center gap-2">
                          <span className="font-semibold">{f.user}</span>: {f.reason} <span className="text-xs text-yellow-400">({new Date(f.date).toLocaleString()})</span>
                          <button
                            className="ml-2 px-2 py-0.5 rounded bg-yellow-700 text-white text-xs font-bold hover:bg-yellow-800"
                            onClick={() => handleDismiss(w.address, w.chain, i)}
                          >Dismiss</button>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};


export default FlaggedWalletsTable;
