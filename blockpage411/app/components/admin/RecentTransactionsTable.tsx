import React, { useEffect, useState } from "react";
import adminFetch from "./adminFetch";

interface Transaction {
  txid: string;
  chain: string;
  address: string;
  from: string;
  to: string;
  value: string;
  date?: string;
  flagged?: boolean;
}

const RecentTransactionsTable: React.FC = () => {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetch(`/api/admin/recent-transactions?page=${page}&limit=${limit}`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setTxs(data.txs || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error('RecentTransactions fetch error', err);
        setError("Failed to load transactions");
        setLoading(false);
      });
    }, [filter, page, limit]);

  const handleFlag = async (txid: string, chain: string, address: string) => {
    const res = await fetch("/api/admin/flag-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txid, chain, address })
    });
    if (res.ok) {
      setTxs(prev => prev.map(t => t.txid === txid && t.chain === chain && t.address === address ? { ...t, flagged: true } : t));
    }
  };

  const filteredTxs = filter
    ? txs.filter(t => t.txid.includes(filter) || t.address.includes(filter) || t.from.includes(filter) || t.to.includes(filter) || t.chain.includes(filter))
    : txs;

  return (
    <section className="mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-green-200">Recent Transactions</h2>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Filter by address, txid, chain..."
            className="w-full px-3 py-2 rounded bg-gray-800 text-green-100 border border-green-700"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-green-200">Loading transactions...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : filteredTxs.length === 0 ? (
        <div className="text-green-200">No transactions found.</div>
      ) : (
        <div className="-mx-4 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-xl shadow-xl">
            <thead>
              <tr className="bg-green-900 text-green-200">
                <th className="py-2 px-4">TxID</th>
                <th className="py-2 px-4">Chain</th>
                <th className="py-2 px-4">Address</th>
                <th className="py-2 px-4">From</th>
                <th className="py-2 px-4">To</th>
                <th className="py-2 px-4">Value</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Flagged</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.map(tx => (
                <tr key={tx.txid + tx.chain + tx.address} className="border-b border-green-800 hover:bg-green-950">
                  <td className="py-2 px-4 font-mono text-green-300">{tx.txid}</td>
                  <td className="py-2 px-4 text-green-200">{tx.chain}</td>
                  <td className="py-2 px-4 text-green-100">{tx.address}</td>
                  <td className="py-2 px-4 text-green-100">{tx.from}</td>
                  <td className="py-2 px-4 text-green-100">{tx.to}</td>
                  <td className="py-2 px-4 text-green-100">{tx.value}</td>
                  <td className="py-2 px-4 text-green-100">{tx.date ? new Date(tx.date).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-green-100">{tx.flagged ? "Yes" : "No"}</td>
                  <td className="py-2 px-4">
                    {!tx.flagged && (
                      <button
                        className="bg-yellow-700 hover:bg-yellow-800 text-white px-2 py-1 rounded text-xs font-bold"
                        onClick={() => handleFlag(tx.txid, tx.chain, tx.address)}
                      >Flag</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-green-300">Page {page} / {Math.max(1, Math.ceil(total / limit))} — {total} transactions</div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-green-200">Per page</label>
              <select value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setPage(1); }} className="bg-gray-800 text-green-100 px-2 py-1 rounded">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded bg-indigo-700 text-white">Prev</button>
              <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded bg-indigo-700 text-white">Next</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentTransactionsTable;
