"use client";
import React, { useEffect, useRef, useState } from 'react';
import { WebSocketProvider } from 'ethers';
import type { NormalizedTransaction, SupportedNetwork, RawWsTransaction } from '../../services/liveFeed/normalizeTransaction';
import { normalizeTransaction } from '../../services/liveFeed/normalizeTransaction';
import { getNativeTokenMetadata } from '../../services/liveFeed/parseTokenMetadata';
import TransactionItem from './TransactionItem';

const NETWORKS: SupportedNetwork[] = ['ethereum', 'bsc', 'polygon'];

const WS_RPC_ENDPOINTS: Partial<Record<SupportedNetwork, string>> = {
  ethereum: process.env.NEXT_PUBLIC_ETH_MAINNET_WSS,
  bsc: process.env.NEXT_PUBLIC_BSC_MAINNET_WSS,
  polygon: process.env.NEXT_PUBLIC_POLYGON_MAINNET_WSS,
};

const MOCK_TXS: NormalizedTransaction[] = [
  {
    id: 'mock-1',
    hash: '0xmockhash001',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    valueNative: 12.3,
    valueUsd: 42000,
    symbol: 'ETH',
    network: 'ethereum',
    timestamp: Date.now(),
    kind: 'large-transfer',
    isIncoming: true,
    isNft: false,
    label: '🔥 Whale Transfer Detected',
  },
  {
    id: 'mock-2',
    hash: '0xmockhash002',
    from: '0x3333333333333333333333333333333333333333',
    to: '0x4444444444444444444444444444444444444444',
    valueNative: 3.4,
    valueUsd: 9000,
    symbol: 'BNB',
    network: 'bsc',
    timestamp: Date.now(),
    kind: 'contract',
    isIncoming: false,
    isNft: false,
  },
  {
    id: 'mock-3',
    hash: '0xmockhash003',
    from: '0x5555555555555555555555555555555555555555',
    to: '0x6666666666666666666666666666666666666666',
    valueNative: 1,
    valueUsd: 2500,
    symbol: 'MATIC',
    network: 'polygon',
    timestamp: Date.now(),
    kind: 'nft',
    isIncoming: true,
    isNft: true,
  },
];

export default function LiveFeed() {
  const [txs, setTxs] = useState<NormalizedTransaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollHeightRef = useRef<number>(0);
  const providersRef = useRef<Record<SupportedNetwork, WebSocketProvider | null>>({
    ethereum: null,
    bsc: null,
    polygon: null,
  });

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
      setTxs((prev) => {
        const next = [...prev, ...buffered];
        // keep last 150 transactions
        return next.slice(-150);
      });
      buffered.length = 0;
      flushTimeout = null;
    };

    const activeProviders: WebSocketProvider[] = [];

    try {
      NETWORKS.forEach((network) => {
        const url = WS_RPC_ENDPOINTS[network];
        if (!url) {
          return;
        }

        const provider = new WebSocketProvider(url);
        providersRef.current[network] = provider;
        activeProviders.push(provider);

        const meta = getNativeTokenMetadata(network);

        provider.on('pending', async (txHash: string) => {
          if (!mounted) return;
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
              usdPrice: undefined,
              largeThresholdUsd: 10_000,
            });

            buffered.push(normalized);
            if (!flushTimeout) {
              flushTimeout = setTimeout(flush, 350);
            }
          } catch (e) {
            if (!mounted) return;
            setError((e as Error).message || 'Live feed connection error');
          }
        });
      });

      if (activeProviders.length === 0) {
        setError('Live feed RPC endpoints not configured – showing demo data.');
        setTxs(MOCK_TXS);
      } else {
        setConnected(true);
      }
    } catch (e) {
      setError((e as Error).message || 'Live feed initialization error');
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
      if (flushTimeout) clearTimeout(flushTimeout);
    };
  }, []);

  return (
    <section
      className="w-full max-w-5xl mx-auto mt-8 rounded-3xl border border-emerald-500/35 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.32), transparent 58%), radial-gradient(circle at 100% 120%, rgba(99,102,241,0.22), transparent 60%), rgba(2,6,23,0.98)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.95)',
      }}
    >
      <header className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/30 bg-black/40">
        <div>
          <h2 className="text-sm sm:text-base font-semibold" style={{ color: '#fefce8' }}>
            Live Whale Watch Feed
          </h2>
          <p className="text-[11px] sm:text-xs" style={{ color: '#a5b4fc' }}>
            Large and notable transactions across Ethereum, BNB Chain, and Polygon.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200 border border-emerald-400/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{connected ? 'Streaming' : 'Connecting'}</span>
          </span>
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
            Waiting for live transactions…
          </div>
        )}
        {txs.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} />
        ))}
      </div>
    </section>
  );
}
