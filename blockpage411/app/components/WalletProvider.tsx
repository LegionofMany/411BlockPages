"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Wallet UI context — exposes a single `open` method.
// Wallet relays have been removed; we route users to /login where
// they can connect via MetaMask (injected/deep link) or Coinbase Wallet SDK.

type WalletContext = {
  open: () => void;
};

const Ctx = createContext<WalletContext | null>(null);

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const api = useMemo<WalletContext>(() => ({
    open: async () => {
      try {
        const res = await fetch('/api/auth/status', {
          credentials: 'include',
          cache: 'no-store',
        });
        const js = await res.json();
        if (!js?.authenticated) {
          router.push('/login');
        }
      } catch (_) {
        router.push('/login');
      }
    }
  }), [router]);

  return (
    <Ctx.Provider value={api}>
      {children}
    </Ctx.Provider>
  );
}

export default WalletProvider;
