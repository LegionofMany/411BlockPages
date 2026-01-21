"use client";
import React, { useEffect, useRef, useState } from 'react';
import type { NormalizedTransaction, SupportedNetwork, RawWsTransaction } from '../../services/liveFeed/normalizeTransaction';
import { normalizeTransaction } from '../../services/liveFeed/normalizeTransaction';
import { getNativeTokenMetadata } from '../../services/liveFeed/parseTokenMetadata';
import TransactionItem from './TransactionItem';

const NETWORKS: SupportedNetwork[] = ['ethereum', 'bsc', 'polygon'];

// Derive production-grade WebSocket endpoints. For Ethereum and Polygon, we
// use Alchemy's WSS URLs keyed off NEXT_PUBLIC_ALCHEMY_KEY. BSC can be
// configured via a dedicated public WSS endpoint.
const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
 
const WS_RPC_ENDPOINTS: Partial<Record<SupportedNetwork, string>> = {
  ethereum: ALCHEMY_KEY ? `wss://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : undefined,
  polygon: ALCHEMY_KEY ? `wss://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : undefined,
  // For BNB Chain, configure a WSS endpoint from your infrastructure
  // provider (e.g. QuickNode, Chainstack) in NEXT_PUBLIC_BSC_MAINNET_WSS.
  bsc: process.env.NEXT_PUBLIC_BSC_MAINNET_WSS,
};

export default function LiveFeed() {
  const [txs, setTxs] = useState<NormalizedTransaction[]>([]);
  const [networkStatus, setNetworkStatus] = useState<Record<SupportedNetwork, 'up' | 'down' | 'connecting'>>({
    ethereum: 'connecting',
    bsc: 'connecting',
    polygon: 'connecting',
  });
  const [whalesOnly, setWhalesOnly] = useState(true);
  const whalesOnlyRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollHeightRef = useRef<number>(0);
  const providersRef = useRef<Record<SupportedNetwork, any | null>>({
    ethereum: null,
    bsc: null,
    polygon: null,
  });
  const retryCountsRef = useRef<Record<SupportedNetwork, number>>({
    ethereum: 0,
    bsc: 0,
    polygon: 0,
  });       
  const seenRef = useRef<Set<string>>(new Set());
  const pollingTimersRef = useRef<Record<string, ReturnType<typeof setInterval> | null>>({});

  const pricesRef = useRef<Record<SupportedNetwork, number | undefined>>({
    ethereum: undefined,
    bsc: undefined,
    polygon: undefined,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      try {
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,matic-network&vs_currencies=usd';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const js = await res.json().catch(() => ({} as any));
        if (cancelled) return;
        const ethUsd = typeof js?.ethereum?.usd === 'number' ? js.ethereum.usd : undefined;
        const bnbUsd = typeof js?.binancecoin?.usd === 'number' ? js.binancecoin.usd : undefined;
        const maticUsd = typeof js?.['matic-network']?.usd === 'number' ? js['matic-network'].usd : undefined;
        pricesRef.current.ethereum = ethUsd;
        pricesRef.current.bsc = bnbUsd;
        pricesRef.current.polygon = maticUsd;
      } catch {
        // ignore
      }
    }

    fetchPrices();
    const t = setInterval(fetchPrices, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    whalesOnlyRef.current = whalesOnly;
  }, [whalesOnly]);

  useEffect(() => {
    // Auto-scroll when new items arrive
    if (!containerRef.current) return;
    const el = containerRef.current;
    if (el.scrollHeight !== lastScrollHeightRef.current) {
      el.scrollTop = el.scrollHeight;
      lastScrollHeightRef.current = el.scrollHeight;
    }
  }, [txs.length]);

  useEffect(() => {
    let mounted = true;

    const buffered: NormalizedTransaction[] = [];
    let flushTimeout: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      if (!mounted || buffered.length === 0) return;

      // Decide whale labels from the buffered batch once.
      const whaleIds = (() => {
        try {
          const recent = buffered.slice();
          recent.sort((a, b) => (b.valueUsd || b.valueNative) - (a.valueUsd || a.valueNative));
          return new Set(recent.slice(0, 5).map((t) => t.id));
        } catch {
          return new Set<string>();
        }
      })();

      setTxs((prev) => {
        // Merge buffered items into existing state, only deduping NEW items.
        // (Do not filter prev items based on seenRef, or the list will collapse
        // to only the newest batch each time.)
        const nextBuffered = buffered
          .filter((t) => {
            if (seenRef.current.has(t.id)) return false;
            seenRef.current.add(t.id);
            return true;
          })
          .map((t) => (whaleIds.has(t.id) ? { ...t, label: t.label || '🔥 Whale Transfer Detected' } : t));

        const combined = [...nextBuffered, ...prev];
        combined.sort((a, b) => {
          if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
          return (b.valueUsd || b.valueNative) - (a.valueUsd || a.valueNative);
        });
        return combined.slice(0, 150);
      });
      buffered.length = 0;
      flushTimeout = null;
    };

    const activeProviders: any[] = [];
    const startedSomethingRef = { started: false };

    try {
      const connectNetwork = async (network: SupportedNetwork) => {
        const url = WS_RPC_ENDPOINTS[network];
        if (!url) {
          // No WSS endpoint configured; use a public HTTP polling fallback.
          setNetworkStatus((prev) => ({ ...prev, [network]: 'connecting' }));
          startPollingFallback(network);
          startedSomethingRef.started = true;
          return;
        }
        setNetworkStatus((prev) => ({ ...prev, [network]: 'connecting' }));

        // Lazy-load ethers to reduce initial bundle size
        let provider: any = null;
        try {
          const ethers = await import('ethers');
          const WebSocketProvider = (ethers as any).WebSocketProvider || (ethers as any).providers?.WebSocketProvider || (ethers as any).providers?.WebSocketProvider;
          provider = new WebSocketProvider(url);
        } catch (err) {
          // If WSS fails to initialize (blocked websockets, missing polyfills, etc.)
          // fall back to public HTTPS polling so the page still works in production.
          setNetworkStatus((prev) => ({ ...prev, [network]: 'connecting' }));
          startPollingFallback(network);
          startedSomethingRef.started = true;
          return;
        }

        providersRef.current[network] = provider;
        activeProviders.push(provider);
        startedSomethingRef.started = true;

        const meta = getNativeTokenMetadata(network);

        const handleError = (err: unknown) => {
          if (!mounted) return;
          setNetworkStatus((prev) => ({ ...prev, [network]: 'down' }));
          setError((err as Error)?.message || 'Live feed connection error');

          const retries = retryCountsRef.current[network] ?? 0;
          const maxRetries = 5;
          if (retries >= maxRetries) return;

          retryCountsRef.current[network] = retries + 1;
          const delayMs = Math.min(30000, 1000 * 2 ** retries);

          setTimeout(() => {
            if (!mounted) return;
            connectNetwork(network);
          }, delayMs);
        };

        // Concurrency-limited processing of pending tx hashes
        const CONCURRENCY = 4;
        let inFlight = 0;
        const queue: string[] = [];

        const processQueue = async () => {
          if (!mounted) return;
          if (inFlight >= CONCURRENCY || queue.length === 0) return;
          const txHash = queue.shift()!;
          inFlight++;
          try {
            const tx = await provider.getTransaction(txHash);
            if (!tx) return;

            const raw: RawWsTransaction = {
              hash: tx.hash,
              from: tx.from ?? '',
              to: tx.to ?? '',
              value: tx.value.toString(),
              input: tx.data,
              blockNumber: tx.blockNumber ?? undefined,
              timestamp: Date.now(),
            };

            const normalized = normalizeTransaction(raw, {
              network,
              nativeSymbol: meta.symbol,
              nativeDecimals: meta.decimals,
              usdPrice: pricesRef.current[network],
              largeThresholdUsd: 1_000_000,
            });

            if (whalesOnlyRef.current && normalized.label !== '🔥 Whale Transfer Detected') {
              return;
            }

            buffered.push(normalized);
            if (!flushTimeout) {
              flushTimeout = setTimeout(flush, 500);
            }
            setNetworkStatus((prev) => ({ ...prev, [network]: 'up' }));
          } catch (e) {
            handleError(e);
          } finally {
            inFlight--;
            processQueue();
          }
        };

        provider.on('pending', (txHash: string) => {
          if (!mounted) return;
          queue.push(txHash);
          processQueue();
        });

        provider.on('error', handleError);
      };

      NETWORKS.forEach((network) => connectNetwork(network));
    } catch (e) {
      setError((e as Error).message || 'Live feed initialization error');
    }

    // Polling fallback implementation (public JSON-RPC over HTTPS)
    function startPollingFallback(network: SupportedNetwork) {
      const base =
        network === 'ethereum'
          ? 'https://cloudflare-eth.com'
          : network === 'polygon'
            ? 'https://polygon-rpc.com'
            : 'https://bsc-dataseed.binance.org';

      async function rpc(method: string, params: unknown[] = []) {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        if (!res.ok) throw new Error(`RPC ${method} failed (${res.status})`);
        const js = await res.json().catch(() => ({} as any));
        return js?.result;
      }

      let lastBlock: string | null = null;
      const poll = async () => {
        try {
          const blockNumHex = await rpc('eth_blockNumber', []);
          if (!blockNumHex) return;
          if (blockNumHex === lastBlock) return;
          lastBlock = blockNumHex;

          const block = await rpc('eth_getBlockByNumber', [blockNumHex, true]);
          const txsInBlock = ((block?.transactions as any[]) || []).slice(0, 30);
          const meta = getNativeTokenMetadata(network);
          for (const rawTx of txsInBlock) {
            const raw: RawWsTransaction = {
              hash: rawTx.hash,
              from: rawTx.from || '',
              to: rawTx.to || '',
              value: rawTx.value || '0',
              input: rawTx.input,
              blockNumber: rawTx.blockNumber,
              timestamp: Date.now(),
            };
            const normalized = normalizeTransaction(raw, {
              network,
              nativeSymbol: meta.symbol,
              nativeDecimals: meta.decimals,
              usdPrice: pricesRef.current[network],
              largeThresholdUsd: 1_000_000,
            });
            if (whalesOnlyRef.current && normalized.label !== '🔥 Whale Transfer Detected') continue;
            buffered.push(normalized);
          }
          if (!flushTimeout) flushTimeout = setTimeout(flush, 500);
          setNetworkStatus((prev) => ({ ...prev, [network]: 'up' }));
        } catch {
          setNetworkStatus((prev) => ({ ...prev, [network]: 'down' }));
        }
      };
      // Start immediate poll and then interval
      void poll();
      const id = setInterval(poll, 10_000);
      pollingTimersRef.current[network] = id;
    }

    return () => {
      mounted = false;
      activeProviders.forEach((p) => {
        try {
          p.destroy();
        } catch {
          // ignore
        }
      });
      providersRef.current = { ethereum: null, bsc: null, polygon: null };
      retryCountsRef.current = { ethereum: 0, bsc: 0, polygon: 0 };
      if (flushTimeout) clearTimeout(flushTimeout);
      // clear any polling fallbacks
      try {
        Object.values(pollingTimersRef.current).forEach((t) => {
          if (t) clearInterval(t as any);
        });
      } catch {
        // ignore
      }
    };
  }, []);

  const connected = Object.values(networkStatus).some((s) => s === 'up');

  useEffect(() => {
    // If nothing is configured, show a single, production-appropriate message.
    // (We poll public RPCs, so the feed should usually come alive, but some networks
    // may still be blocked by corporate DNS/firewalls.)
    const anyConfigured = Object.values(networkStatus).some((s) => s === 'connecting' || s === 'up');
    if (!anyConfigured) {
      setError('Live feed is unavailable in this environment.');
    }
  }, [networkStatus]);

  return (
    <section
      className="w-full max-w-5xl mx-auto mt-8 rounded-3xl border border-emerald-500/35 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.32), transparent 58%), radial-gradient(circle at 100% 120%, rgba(99,102,241,0.22), transparent 60%), rgba(2,6,23,0.98)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.95)',
      }}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b border-emerald-500/30 bg-black/40">
        <div>
          <h2 className="text-sm sm:text-base font-semibold" style={{ color: '#fefce8' }}>
            Live Whale Watch Feed
          </h2>
          <p className="text-[11px] sm:text-xs" style={{ color: '#cbd5e1' }}>
            Only transactions estimated above $1,000,000 USD.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            {NETWORKS.map((n) => {
              const status = networkStatus[n];
              const color =
                status === 'up'
                  ? 'bg-emerald-500'
                  : status === 'connecting'
                  ? 'bg-amber-400'
                  : 'bg-red-500';
              const label = n === 'bsc' ? 'BNB' : n === 'ethereum' ? 'ETH' : 'Polygon';
              return (
                <span
                  key={n}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2 py-0.5 text-slate-200 border border-slate-600/60"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${color} ${status === 'up' ? 'animate-pulse' : ''}`} />
                  <span>{label}</span>
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 text-[11px] text-slate-200">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-slate-500 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                checked={whalesOnly}
                onChange={(e) => setWhalesOnly(e.target.checked)}
              />
              <span>Whale transfers only (≥ $1M)</span>
            </label>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200 border border-emerald-400/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{connected ? 'Streaming' : 'Connecting'}</span>
            </span>
          </div>
        </div>
      </header>
      <div
        ref={containerRef}
        className="max-h-[420px] overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {error && (
          <div className="mb-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
            {error}
          </div>
        )}
        {txs.length === 0 && !error && (
          <div className="text-[11px] text-slate-300">
            {connected ? 'Waiting for live transactions…' : 'Connecting to live feeds…'}
          </div>
        )}
        {txs.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} />
        ))}
      </div>
    </section>
  );
}
