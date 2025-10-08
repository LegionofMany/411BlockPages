
import { useEffect, useState } from "react";

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
    fetch("/api/admin/flagged-transactions", {
      headers: { "x-admin-address": adminWallet }
    })
      .then(res => res.json())
      .then(data => {
        setFlaggedTxs(data.flaggedTxs || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load flagged transactions");
        setLoading(false);
      });
  }, [adminWallet]);

  const handleDismiss = async (txid: string, chain: string, address: string, flagIndex: number) => {
    const res = await fetch("/api/admin/dismiss-transaction-flag", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-address": adminWallet
      },
      body: JSON.stringify({ txid, chain, address, flagIndex })
    });
    if (res.ok) {
      setFlaggedTxs(prev => prev.map(t => {
        if (t.txid === txid && t.chain === chain && t.address === address) {
          const flags = (t.flags || []).filter((_: Flag, idx: number) => idx !== flagIndex);
          return { ...t, flags, flagged: flags.length > 1 };
        }
        return t;
      }).filter(t => t.flagged !== false));
    }
  };

  const handleResolve = async (txid: string, chain: string, address: string) => {
    const res = await fetch("/api/admin/dismiss-transaction-flag", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-address": adminWallet
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
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-pink-300">Flagged Transactions</h2>
        <button
          className="bg-pink-700 hover:bg-pink-800 text-white px-4 py-2 rounded text-sm font-bold"
          onClick={handleExportCSV}
        >
          Download CSV
        </button>
      </div>
      {loading ? (
        <div className="text-pink-200">Loading flagged transactions...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : flaggedTxs.length === 0 ? (
        <div className="text-pink-200">No flagged transactions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 rounded-xl shadow-xl">
            <thead>
              <tr className="bg-pink-900 text-pink-200">
                <th className="py-2 px-4">TxID</th>
                <th className="py-2 px-4">Chain</th>
                <th className="py-2 px-4">Address</th>
                <th className="py-2 px-4">From</th>
                <th className="py-2 px-4">To</th>
                <th className="py-2 px-4">Value</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4"># Flags</th>
                <th className="py-2 px-4">Flag Details</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedTxs.map(tx => (
                <tr key={tx.txid + tx.chain + tx.address} className="border-b border-pink-800 hover:bg-pink-950">
                  <td className="py-2 px-4 font-mono text-pink-300">{tx.txid}</td>
                  <td className="py-2 px-4 text-pink-200">{tx.chain}</td>
                  <td className="py-2 px-4 text-pink-100">{tx.address}</td>
                  <td className="py-2 px-4 text-pink-100">{tx.from}</td>
                  <td className="py-2 px-4 text-pink-100">{tx.to}</td>
                  <td className="py-2 px-4 text-pink-100">{tx.value}</td>
                  <td className="py-2 px-4 text-pink-100">{tx.date ? new Date(tx.date).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-pink-100">{tx.flags?.length || 0}</td>
                  <td className="py-2 px-4">
                    <ul className="list-disc pl-4 space-y-1">
                      {tx.flags?.map((f, i) => (
                        <li key={i} className="text-pink-100 text-sm flex items-center gap-2">
                          <span className="font-semibold">{f.user}</span>: {f.reason} <span className="text-xs text-pink-400">({f.date ? new Date(f.date).toLocaleString() : '-'})</span>
                          <button
                            className="ml-2 px-2 py-0.5 rounded bg-pink-700 text-white text-xs font-bold hover:bg-pink-800"
                            onClick={() => handleDismiss(tx.txid, tx.chain, tx.address, i)}
                          >Dismiss</button>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2 px-4">
                    <button
                      className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs font-bold"
                      onClick={() => handleResolve(tx.txid, tx.chain, tx.address)}
                    >Resolve All</button>
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
