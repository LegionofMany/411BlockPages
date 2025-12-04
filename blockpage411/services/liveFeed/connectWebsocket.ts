import { io, Socket } from 'socket.io-client';
import type { NormalizedTransaction, SupportedNetwork, RawWsTransaction } from './normalizeTransaction';
import { normalizeTransaction } from './normalizeTransaction';
import { getNativeTokenMetadata } from './parseTokenMetadata';

export interface LiveFeedConfig {
  networks: SupportedNetwork[];
  largeThresholdUsd?: number;
}

export interface LiveFeedCallbacks {
  onTransaction: (tx: NormalizedTransaction) => void;
  onError?: (err: Error) => void;
}

export interface LiveFeedConnection {
  disconnect: () => void;
}

// For this implementation, we assume a backend websocket server in server.ts that
// proxies Alchemy/QuickNode/Infura subscriptions and emits normalized-ish events.
// This keeps API keys on the server and avoids CORS issues.

export function connectLiveFeed(config: LiveFeedConfig, callbacks: LiveFeedCallbacks): LiveFeedConnection {
  const { networks, largeThresholdUsd = 10_000 } = config;
  const socketUrl = process.env.NEXT_PUBLIC_LIVE_FEED_WS_URL || `${process.env.NEXT_PUBLIC_APP_URL?.replace(/^http/, 'ws')}/realtime`;

  let socket: Socket | null = null;

  function setup() {
    if (!socketUrl) {
      callbacks.onError?.(new Error('Live feed WebSocket URL not configured'));
      return;
    }

    socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on('connect_error', (err) => {
      callbacks.onError?.(err as Error);
    });

    socket.on('connect', () => {
      // Subscribe to requested networks and event types
      socket?.emit('subscribe', {
        networks,
        topics: ['pendingTransactions', 'newBlockHeaders', 'largeTransfers'],
      });
    });

    socket.on('tx', (payload: { network: SupportedNetwork; tx: RawWsTransaction; priceUsd?: number }) => {
      try {
        const meta = getNativeTokenMetadata(payload.network);
        const normalized = normalizeTransaction(payload.tx, {
          network: payload.network,
          nativeSymbol: meta.symbol,
          nativeDecimals: meta.decimals,
          usdPrice: payload.priceUsd,
          largeThresholdUsd,
        });
        callbacks.onTransaction(normalized);
      } catch (e) {
        callbacks.onError?.(e as Error);
      }
    });

    socket.on('error', (e: unknown) => {
      callbacks.onError?.(e instanceof Error ? e : new Error(String(e)));
    });
  }

  setup();

  return {
    disconnect() {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    },
  };
}
