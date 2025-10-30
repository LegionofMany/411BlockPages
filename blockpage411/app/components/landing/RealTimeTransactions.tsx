"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiZap, FiAlertTriangle, FiCheckCircle, FiLoader } from "react-icons/fi";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  timestamp: string;
}

export default function RealTimeTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'retrying' | 'failed'>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const maxRetries = 6;
    const baseDelay = 1200;

    const connectWithRetry = async (attemptNum = 0): Promise<void> => {
      setAttempt(attemptNum);
      setStatus(attemptNum === 0 ? 'connecting' : 'retrying');

      try {
        const AblyModule = await import('ably');
        
        const fetchToken = async () => {
          const resp = await fetch('/api/realtime/token');
          if (!resp.ok) throw new Error('Token endpoint returned ' + resp.status);
          return await resp.json();
        };

        const tokenResponse = await fetchToken();
        let tokenRequest: unknown;
        if (tokenResponse && typeof tokenResponse === 'object' && ('tokenRequest' in (tokenResponse as Record<string, unknown>))) {
          tokenRequest = (tokenResponse as Record<string, unknown>)['tokenRequest'];
        } else {
          tokenRequest = tokenResponse;
        }

        type RealtimeCtor = new (opts: { authCallback?: (params: unknown, cb: (err: Error | null, tokenRequest?: unknown) => void) => void }) => {
          channels: { get: (name: string) => { subscribe: (ev: string, cb: (msg: unknown) => void) => void; unsubscribe: () => void } };
          close: () => void;
          connection?: { on: (ev: string, cb: (...args: unknown[]) => void) => void };
        };
        const RealtimeConstructor = (AblyModule as unknown as { Realtime: unknown }).Realtime as RealtimeCtor;

        const realtime = new RealtimeConstructor({
          authCallback: (_params, cb) => cb(null, tokenRequest),
        });

        realtime.connection?.on('connected', () => {
          setStatus('connected');
          setAttempt(0);
        });

        realtime.connection?.on('failed', async () => {
          try { realtime.close(); } catch {}
          if (attemptNum < maxRetries) {
            const delay = baseDelay * Math.pow(2, attemptNum);
            setTimeout(() => connectWithRetry(attemptNum + 1), delay);
          } else {
            setStatus('failed');
          }
        });

        const channel = realtime.channels.get('transactions');
        channel.subscribe('tx', (msg: unknown) => {
          const m = msg as { data?: unknown } | undefined;
          if (m && m.data) {
            setTransactions((prev) => [(m.data as Transaction), ...prev].slice(0, 10));
          }
        });

        cleanup = () => {
          try { channel.unsubscribe(); } catch {}
          try { realtime.close(); } catch {}
        };
      } catch (err) {
        console.warn('Ably connection attempt failed', err);
        if (attemptNum < maxRetries) {
          const delay = baseDelay * Math.pow(2, attemptNum);
          setTimeout(() => connectWithRetry(attemptNum + 1), delay);
        } else {
          setStatus('failed');
        }
      }
    };

    connectWithRetry(0);

    return () => cleanup && cleanup();
  }, []);

  const StatusIndicator = () => {
    let icon, text, color;
    switch (status) {
      case 'connected':
        icon = <FiCheckCircle className="animate-pulse" />;
        text = "Live";
        color = "text-green-400";
        break;
      case 'connecting':
        icon = <FiLoader className="animate-spin" />;
        text = "Connecting...";
        color = "text-yellow-400";
        break;
      case 'retrying':
        icon = <FiLoader className="animate-spin" />;
        text = `Retrying (${attempt})...`;
        color = "text-yellow-400";
        break;
      case 'failed':
        icon = <FiAlertTriangle />;
        text = "Connection Failed";
        color = "text-red-400";
        break;
      default:
        icon = <FiZap />;
        text = "Live Transaction Feed";
        color = "text-slate-400";
    }
    return (
      <div className={`flex items-center justify-center gap-2 text-sm font-medium ${color}`}>
        {icon}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <section
      className="w-full max-w-7xl mx-auto text-center py-20 px-4"
      style={{
        color: '#e6d6a7'
      }}
    >
      <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
        Live Transaction Feed
      </h2>
  <p className="mb-12" style={{ color: 'rgba(203,213,225,0.8)' }}>Watch new transactions as they happen on the network.</p>

      <div className="rounded-3xl shadow-lg p-4 sm:p-6"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="mb-6">
          <StatusIndicator />
        </div>
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((tx, i) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.18)',
                  border: '1px solid',
                  borderColor: 'rgba(255,255,255,0.03)'
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-xs truncate w-full sm:w-1/3 text-left font-mono hover:text-slate-200 transition-colors" style={{ color: 'rgba(203,213,225,0.85)' }}>{tx.hash}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-center">
                    <span className="truncate max-w-[100px] sm:max-w-[120px]" style={{ color: 'rgba(203,213,225,0.75)' }}>From: {tx.from}</span>
                    <FiArrowRight className="" style={{ color: 'rgba(148,163,184,0.8)' }} />
                    <span className="truncate max-w-[100px] sm:max-w-[120px]" style={{ color: 'rgba(203,213,225,0.75)' }}>To: {tx.to}</span>
                  </div>
                  <p className="text-sm font-bold whitespace-nowrap" style={{ color: '#34d399' }}>{tx.value.toFixed(4)} ETH</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FiLoader className="animate-spin text-4xl mx-auto mb-4" />
              Waiting for new transactions...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
