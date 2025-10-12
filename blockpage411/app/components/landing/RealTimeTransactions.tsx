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
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'retrying' | 'failed'>('idle');
  const [attempt, setAttempt] = useState(0);
  const [tokenFetchMs, setTokenFetchMs] = useState<number | null>(null);
  const [serverElapsedMs, setServerElapsedMs] = useState<number | null>(null);
  const [tokenKeyName, setTokenKeyName] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

  // Ably with retry/backoff and status UI (no local WS fallback)
  const maxRetries = 6; // try a few more times
  const baseDelay = 1200; // ms (slightly larger base delay)

    const connectWithRetry = async (attemptNum = 0): Promise<void> => {
      setAttempt(attemptNum);
      setStatus(attemptNum === 0 ? 'connecting' : 'retrying');

      try {
        const AblyModule = await import('ably');

        // Fetch tokenRequest from our server BEFORE creating the Ably client.
        // Try a few quick attempts; if we can't get a token, try the whole connection later.
        const fetchToken = async (tries = 5, delayMs = 1000): Promise<unknown> => {
          let lastErr: Error | null = null;
          for (let i = 0; i < tries; i++) {
            try {
              const tStart = performance.now();
              const resp = await fetch('/api/realtime/token');
              const tEnd = performance.now();
              if (!resp.ok) throw new Error('token endpoint returned ' + resp.status);
              const tokenRequest = await resp.json();
              const tr = tokenRequest as Record<string, unknown>;
              const nested = tr['tokenRequest'] as Record<string, unknown> | undefined;
              const keyName = (nested?.['keyName'] ?? tr?.['keyName']) as string | undefined;
              const srvElapsed = typeof tr['elapsedMs'] === 'number' ? (tr['elapsedMs'] as number) : undefined;
              setTokenFetchMs(Math.round(tEnd - tStart));
              if (typeof srvElapsed === 'number') setServerElapsedMs(srvElapsed);
              if (keyName) setTokenKeyName(keyName);
              setTokenError(null);
              console.debug('[RealTimeTransactions] fetched token', { fetchMs: (tEnd - tStart), tokenSummary: { keyName }, serverElapsedMs: srvElapsed });
              return tokenRequest as unknown;
            } catch (err) {
              lastErr = err as Error;
              // small backoff
              console.warn('[RealTimeTransactions] token fetch failed, attempt', i + 1, 'of', tries, err);
              setTokenError((err as Error)?.message ?? String(err));
              await new Promise((res) => setTimeout(res, delayMs));
            }
          }
          throw lastErr;
        };

        // fetch tokenRequest payload (server now wraps tokenRequest in { tokenRequest, elapsedMs, serverTimestamp })
        const tokenResponse = await fetchToken(5, 1000);
        // tokenResponse is unknown; safely extract tokenRequest if present
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

        // Create the client, providing a synchronous authCallback that immediately
        // returns the tokenRequest we already fetched. This avoids Ably waiting for
        // an async token call that could time out.
        const realtime = new RealtimeConstructor({
          authCallback: (_params, cb) => cb(null, tokenRequest),
        });

  console.debug('[RealTimeTransactions] Ably.Realtime created; waiting for connection events');

        // Listen for successful connection
        try {
          realtime.connection?.on('connected', () => {
            setStatus('connected');
            setAttempt(0);
          });
        } catch { /* ignore */ }

        // If Ably disconnects or fails, trigger retry logic
        try {
          realtime.connection?.on('failed', async () => {
            try { realtime.close(); } catch {}
            if (attemptNum < maxRetries) {
              const delay = baseDelay * Math.pow(2, attemptNum);
              setTimeout(() => connectWithRetry(attemptNum + 1), delay);
            } else {
              setStatus('failed');
            }
          });
        } catch { /* ignore */ }

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

    // Start first attempt
    connectWithRetry(0);

    return () => cleanup && cleanup();
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto text-center py-16">
      <h2 className="text-4xl font-bold mb-8 text-cyan-200">Live Transaction Feed</h2>
      <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <span className="text-sm text-gray-300 mr-2">Status:</span>
          <span className="text-sm font-medium">
            {status === 'idle' && 'idle'}
            {status === 'connecting' && 'connecting...'}
            {status === 'connected' && 'connected'}
            {status === 'retrying' && `retrying (attempt ${attempt + 1})`}
            {status === 'failed' && 'failed to connect'}
          </span>
        </div>
        {/* Debug panel - visible in dev to help diagnose token fetch/connect issues */}
        <div className="mb-3 text-left text-xs text-gray-400">
          <div>Token fetch: {tokenFetchMs !== null ? `${tokenFetchMs} ms` : 'n/a'}</div>
          <div>Server token elapsed: {serverElapsedMs !== null ? `${serverElapsedMs} ms` : 'n/a'}</div>
          <div>Token keyName: {tokenKeyName ?? 'n/a'}</div>
          <div className="text-red-300">Last token error: {tokenError ?? 'none'}</div>
        </div>
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
