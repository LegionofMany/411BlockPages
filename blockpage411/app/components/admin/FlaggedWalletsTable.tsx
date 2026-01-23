
import { useEffect, useState } from "react";
import adminFetch from "./adminFetch";

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
    adminFetch("/api/admin/flagged-wallets")
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setFlaggedWallets(data.flaggedWallets || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('FlaggedWallets fetch error', err);
        setError("Failed to load flagged wallets");
        setLoading(false);
      });
  }, [adminWallet]);

  const handleDismiss = async (address: string, chain: string, flagIndex: number) => {
    const res = await adminFetch("/api/admin/dismiss-wallet-flag", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, chain, flagIndex })
    });
    if (res.ok) {
      setFlaggedWallets(prev =>
        prev
          .map(ww =>
            ww.address === address && ww.chain === chain
              ? { ...ww, flags: ww.flags.filter((_: Flag, idx: number) => idx !== flagIndex) }
              : ww
          )
          .filter(ww => ww.flags.length > 0)
      );
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100">Flagged Wallets</h2>
      </div>
      {loading ? (
        <div className="px-4 py-4 text-slate-200">Loading flagged wallets...</div>
      ) : error ? (
        <div className="px-4 py-4 text-red-400">{error}</div>
      ) : flaggedWallets.length === 0 ? (
        <div className="px-4 py-4 text-slate-200">No flagged wallets found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-200">
                <th className="py-2 px-4 text-left">Address</th>
                <th className="py-2 px-4 text-left">Chain</th>
                <th className="py-2 px-4 text-left"># Flags</th>
                <th className="py-2 px-4 text-left">Flag Details</th>
              </tr>
            </thead>
            <tbody>
              {flaggedWallets.map(w => (
                <tr key={w.address + w.chain} className="border-t border-white/10 hover:bg-white/5">
                  <td className="py-2 px-4 font-mono text-slate-200 break-all">{w.address}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{w.chain}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{w.flags.length}</td>
                  <td className="py-2 px-4">
                    <ul className="list-disc pl-4 space-y-2">
                      {w.flags.map((f, i) => (
                        <li key={i} className="text-slate-200 text-xs sm:text-sm flex flex-wrap items-center gap-2">
                          <span className="font-semibold break-all">{f.user}</span>
                          <span className="text-white/80 break-words">{f.reason}</span>
                          <span className="text-xs text-white/50 whitespace-nowrap">({new Date(f.date).toLocaleString()})</span>
                          <button
                            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                            onClick={() => handleDismiss(w.address, w.chain, i)}
                            type="button"
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
