import React, { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/recent-transactions")
      .then(res => res.json())
      .then(data => {
        setTxs(data.txs || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load transactions");
        setLoading(false);
      });
  }, []);

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
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-green-200">Recent Transactions</h2>
        <input
          type="text"
          placeholder="Filter by address, txid, chain..."
          className="px-3 py-1 rounded bg-gray-800 text-green-100 border border-green-700"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="text-green-200">Loading transactions...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : filteredTxs.length === 0 ? (
        <div className="text-green-200">No transactions found.</div>
      ) : (
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
      )}
    </section>
  );
};

export default RecentTransactionsTable;
