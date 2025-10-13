"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useConnect } from 'wagmi';

export default function WalletConnectButtons({ onError }: { onError?: (e: any) => void }) {
  const { connect } = useConnect();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleInjected() {
    setLoading('injected');
    try {
      // import at runtime only in client; use connectors index to avoid subpath export issues
  const mod = await import('wagmi/connectors');
      // connector default export is a class/function; some wagmi versions export factories
      const connectorFactory = (mod as any).injected ?? (mod as any).default ?? (mod as any).InjectedConnector;
      // attempt to call as factory if present
      const connector = typeof connectorFactory === 'function' ? connectorFactory() : connectorFactory;
      await connect({ connector });
    } catch (e) {
      console.warn('Injected connect failed', e);
      onError?.(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleWalletConnect() {
    setLoading('walletconnect');
    try {
  const mod = await import('wagmi/connectors');
      const factory = (mod as any).walletConnect ?? (mod as any).default ?? (mod as any).WalletConnectConnector;
      const connector = typeof factory === 'function' ? factory({ projectId: 'demo' }) : factory;
      await connect({ connector });
    } catch (e) {
      console.warn('WalletConnect failed', e);
      onError?.(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleCoinbase() {
    setLoading('coinbase');
    try {
  const mod = await import('wagmi/connectors');
      const factory = (mod as any).coinbaseWallet ?? (mod as any).default ?? (mod as any).CoinbaseWalletConnector;
      const connector = typeof factory === 'function' ? factory() : factory;
      await connect({ connector });
    } catch (e) {
      console.warn('Coinbase connect failed', e);
      onError?.(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-500"
        onClick={handleInjected}
        disabled={!!loading}
      >
        <span className="text-2xl">🦊</span>
        <span className="font-bold">MetaMask</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-sky-500"
        onClick={handleWalletConnect}
        disabled={!!loading}
      >
        <span className="text-2xl">🔗</span>
        <span className="font-bold">WalletConnect</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500"
        onClick={handleCoinbase}
        disabled={!!loading}
      >
        <span className="text-2xl">💼</span>
        <span className="font-bold">Coinbase Wallet</span>
      </button>
    </div>
  );
}
