"use client";
import { useEffect, useState } from "react";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  timestamp: string;
}

export default function RealTimeTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      try {
        const transaction = JSON.parse(event.data);
        setTransactions((prevTransactions) => [
          transaction,
          ...prevTransactions.slice(0, 9),
        ]);
      } catch (error) {
        // Ignore welcome message
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto text-center py-16">
      <h2 className="text-4xl font-bold mb-8 text-cyan-200">Real-Time Transactions</h2>
      <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg">
        <ul>
          {transactions.map((tx) => (
            <li key={tx.hash} className="border-b border-gray-700 py-2">
              <p className="text-sm text-white truncate">Hash: {tx.hash}</p>
              <p className="text-xs text-gray-400">From: {tx.from}</p>
              <p className="text-xs text-gray-400">To: {tx.to}</p>
              <p className="text-xs text-gray-400">Value: {tx.value.toFixed(4)} ETH</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
