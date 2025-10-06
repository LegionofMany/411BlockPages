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
      } catch {
        // Ignore welcome message
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto text-center py-16">
      <h2 className="text-4xl font-bold mb-8 text-cyan-200">Live Transaction Feed</h2>
      <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg">
        <ul>
          {transactions.map((tx) => (
            <li key={tx.hash} className="border-b border-gray-700 py-3 px-2 hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-white truncate w-1/3">{tx.hash}</p>
                <div className="flex flex-col items-center">
                  <p className="text-xs text-gray-400">From: {tx.from}</p>
                  <p className="text-xs text-gray-400">To: {tx.to}</p>
                </div>
                <p className="text-sm text-green-400 font-bold">{tx.value.toFixed(4)} ETH</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
