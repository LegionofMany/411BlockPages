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
    let cleanup: (() => void) | undefined;

    // Prefer token-based auth via /api/realtime/token for secure client access to Ably
    import('ably').then((AblyModule) => {
      try {
        type RealtimeCtor = new (opts: { authCallback?: (params: unknown, cb: (err: Error | null, tokenRequest?: unknown) => void) => void }) => {
          channels: { get: (name: string) => { subscribe: (ev: string, cb: (msg: unknown) => void) => void; unsubscribe: () => void } };
          close: () => void;
        };
        const RealtimeConstructor = (AblyModule as unknown as { Realtime: unknown }).Realtime as RealtimeCtor;

        const realtime = new RealtimeConstructor({
          authCallback: (_params, cb) => {
            fetch('/api/realtime/token')
              .then((r) => r.json())
              .then((tokenRequest) => cb(null, tokenRequest))
              .catch((err) => cb(err as Error, undefined));
          },
        });

        const channel = realtime.channels.get('transactions');
        channel.subscribe('tx', (msg: unknown) => {
          const m = msg as { data?: unknown } | undefined;
          if (m && m.data) {
            setTransactions((prev) => [(m.data as Transaction), ...prev].slice(0, 10));
          }
        });
        cleanup = () => {
          channel.unsubscribe();
          realtime.close();
        };
      } catch (e) {
        console.warn('Ably init error', e);
      }
    }).catch((e) => {
      // If Ably isn't available for some reason, fallback to local WS
      console.warn('Failed loading ably, falling back to local WS', e);
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${host}:8080`;
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {};
      ws.onerror = (err) => {
        console.warn('Realtime WS error', err);
      };
      ws.onmessage = (event) => {
        try {
          const transaction = JSON.parse(event.data);
          setTransactions((prevTransactions) => [transaction, ...prevTransactions].slice(0, 10));
        } catch {
          // Ignore welcome message
        }
      };
      cleanup = () => ws.close();
    });

    return () => cleanup && cleanup();
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
