
import { useEffect, useState } from "react";
import adminFetch from "./adminFetch";

interface Flag {
  user: string;
  reason: string;
  date: string;
}

interface FlaggedTx {
  txid: string;
  chain: string;
  address: string;
  from: string;
  to: string;
  value: string;
  date?: string;
  flags?: Flag[];
  flagged?: boolean;
}

interface FlaggedTransactionsTableProps {
  adminWallet: string;
}

const FlaggedTransactionsTable: React.FC<FlaggedTransactionsTableProps> = ({ adminWallet }) => {
  const [flaggedTxs, setFlaggedTxs] = useState<FlaggedTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminWallet) return;
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/flagged-transactions")
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setFlaggedTxs(data.flaggedTxs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('FlaggedTransactions fetch error', err);
        setError("Failed to load flagged transactions");
        setLoading(false);
      });
  }, [adminWallet]);

  const handleDismiss = async (txid: string, chain: string, address: string, flagIndex: number) => {
    const res = await adminFetch("/api/admin/dismiss-transaction-flag", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid, chain, address, flagIndex })
    });
    if (res.ok) {
      setFlaggedTxs(prev => prev.map(t => {
        if (t.txid === txid && t.chain === chain && t.address === address) {
          const flags = (t.flags || []).filter((_: Flag, idx: number) => idx !== flagIndex);
          return { ...t, flags, flagged: flags.length > 0 };
        }
        return t;
      }).filter(t => t.flagged !== false));
    }
  };

  const handleResolve = async (txid: string, chain: string, address: string) => {
    const res = await adminFetch("/api/admin/dismiss-transaction-flag", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid, chain, address, flagIndex: null })
    });
    if (res.ok) {
      setFlaggedTxs(prev => prev.filter(t => !(t.txid === txid && t.chain === chain && t.address === address)));
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["TxID","Chain","Address","From","To","Value","Date","# Flags","Flag Details"],
      ...flaggedTxs.map(tx => [
        tx.txid, tx.chain, tx.address, tx.from, tx.to, tx.value, tx.date ? new Date(tx.date).toLocaleString() : '-',
        tx.flags?.length || 0,
  (tx.flags || []).map((f: Flag) => `${f.user}: ${f.reason} (${f.date ? new Date(f.date).toLocaleString() : '-'})`).join("; ")
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flagged_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100">Flagged Transactions</h2>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            onClick={handleExportCSV}
            type="button"
          >
            Download CSV
          </button>
        </div>
      </div>
      {loading ? (
        <div className="px-4 py-4 text-slate-200">Loading flagged transactions...</div>
      ) : error ? (
        <div className="px-4 py-4 text-red-400">{error}</div>
      ) : flaggedTxs.length === 0 ? (
        <div className="px-4 py-4 text-slate-200">No flagged transactions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-200">
                <th className="py-2 px-4 text-left">TxID</th>
                <th className="py-2 px-4 text-left">Chain</th>
                <th className="py-2 px-4 text-left">Address</th>
                <th className="py-2 px-4 text-left">From</th>
                <th className="py-2 px-4 text-left">To</th>
                <th className="py-2 px-4 text-left">Value</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left"># Flags</th>
                <th className="py-2 px-4 text-left">Flag Details</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedTxs.map(tx => (
                <tr key={tx.txid + tx.chain + tx.address} className="border-t border-white/10 hover:bg-white/5">
                  <td className="py-2 px-4 font-mono text-slate-200 break-all">{tx.txid}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{tx.chain}</td>
                  <td className="py-2 px-4 font-mono text-slate-200 break-all">{tx.address}</td>
                  <td className="py-2 px-4 font-mono text-slate-300 break-all">{tx.from}</td>
                  <td className="py-2 px-4 font-mono text-slate-300 break-all">{tx.to}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{tx.value}</td>
                  <td className="py-2 px-4 text-slate-300 whitespace-nowrap">{tx.date ? new Date(tx.date).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{tx.flags?.length || 0}</td>
                  <td className="py-2 px-4">
                    <ul className="list-disc pl-4 space-y-2">
                      {tx.flags?.map((f, i) => (
                        <li key={i} className="text-slate-200 text-xs sm:text-sm flex flex-wrap items-center gap-2">
                          <span className="font-semibold break-all">{f.user}</span>
                          <span className="text-white/80 break-words">{f.reason}</span>
                          <span className="text-xs text-white/50 whitespace-nowrap">({f.date ? new Date(f.date).toLocaleString() : '-'})</span>
                          <button
                            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                            onClick={() => handleDismiss(tx.txid, tx.chain, tx.address, i)}
                            type="button"
                          >
                            Dismiss
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap">
                    <button
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-emerald-400/40 bg-emerald-500/90 text-black hover:bg-emerald-500"
                      onClick={() => handleResolve(tx.txid, tx.chain, tx.address)}
                      type="button"
                    >
                      Resolve All
                    </button>
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


export default FlaggedTransactionsTable;
