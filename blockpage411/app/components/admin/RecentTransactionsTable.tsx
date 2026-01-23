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
    }, [page, limit]);

  const handleFlag = async (txid: string, chain: string, address: string) => {
    const res = await adminFetch("/api/admin/flag-transaction", {
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
    <section className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100">Recent Transactions</h2>
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Filter by address, txid, chain..."
            className="w-full px-3 py-2 rounded-md bg-black/30 text-slate-100 border border-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="px-4 py-4 text-slate-200">Loading transactions...</div>
      ) : error ? (
        <div className="px-4 py-4 text-red-400">{error}</div>
      ) : filteredTxs.length === 0 ? (
        <div className="px-4 py-4 text-slate-200">No transactions found.</div>
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
                <th className="py-2 px-4 text-left">Flagged</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.map(tx => (
                <tr key={tx.txid + tx.chain + tx.address} className="border-t border-white/10 hover:bg-white/5">
                  <td className="py-2 px-4 font-mono text-slate-200 break-all">{tx.txid}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{tx.chain}</td>
                  <td className="py-2 px-4 font-mono text-slate-200 break-all">{tx.address}</td>
                  <td className="py-2 px-4 font-mono text-slate-300 break-all">{tx.from}</td>
                  <td className="py-2 px-4 font-mono text-slate-300 break-all">{tx.to}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{tx.value}</td>
                  <td className="py-2 px-4 text-slate-300 whitespace-nowrap">{tx.date ? new Date(tx.date).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-slate-200 whitespace-nowrap">{tx.flagged ? "Yes" : "No"}</td>
                  <td className="py-2 px-4">
                    {!tx.flagged && (
                      <button
                        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-amber-400/40 bg-amber-400/80 text-black hover:bg-amber-400"
                        onClick={() => handleFlag(tx.txid, tx.chain, tx.address)}
                        type="button"
                      >
                        Flag
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-white/10">
            <div className="text-xs sm:text-sm text-white/70">
              Page {page} / {Math.max(1, Math.ceil(total / limit))} — {total} transactions
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs sm:text-sm text-white/70">Per page</label>
              <select
                value={limit}
                onChange={e => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="bg-black/30 text-slate-100 px-2 py-1 rounded-md border border-white/10"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 disabled:opacity-50"
                type="button"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 disabled:opacity-50"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentTransactionsTable;
