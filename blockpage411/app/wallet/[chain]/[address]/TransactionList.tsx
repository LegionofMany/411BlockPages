import React from "react";
import type { Transaction } from "../../../../lib/types";

interface TransactionListProps {
  transactions?: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  if (!transactions || transactions.length === 0) return null;
  return (
    <div className="mt-6 w-full text-left">
      <h3 className="text-cyan-300 font-semibold mb-2">Recent Transactions</h3>
      <ul className="space-y-2">
        {transactions.map((tx, i) => (
          <li key={i} className="bg-gray-900 border border-blue-700 rounded-lg p-2">
            <span className="text-cyan-200 font-mono">{tx.txid || tx.hash}</span>
            <div className="text-cyan-400">From: {tx.from} To: {tx.to} Value: {tx.value}</div>
            <span className="text-xs text-cyan-500">Date: {tx.date ? new Date(tx.date).toLocaleString() : 'N/A'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
