"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initReownAppKit, getReownAppKit } from '../../lib/appkit';

// Wallet UI context — exposes a single `open` method to request the wallet
// modal. The provider initializes Reown AppKit client-side only and attempts
// to invoke common UI entrypoints on the loaded SDK. This file is intentionally
// client-only to avoid importing WalletConnect networking code during SSR.

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initReownAppKit();
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('WalletProvider: initReownAppKit failed', err);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const api = useMemo<WalletContext>(() => ({
    open: () => {
      const inst = getReownAppKit();
      if (!inst) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Wallet UI not available: Reown AppKit not initialized.');
        }
        return;
      }

      const appkit = (inst as any).appkit || inst;
      // Try a few common API entrypoints without throwing if they don't exist.
      try {
        if (typeof appkit.showWalletModal === 'function') return appkit.showWalletModal();
        if (appkit.ui && typeof appkit.ui.open === 'function') return appkit.ui.open();
        if (appkit.controllers && appkit.controllers.wallet && typeof appkit.controllers.wallet.open === 'function') return appkit.controllers.wallet.open();
        // If no known UI entrypoint is available, do nothing silently in prod.
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('WalletProvider: no UI entrypoint found on Reown AppKit instance.');
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('WalletProvider: error opening wallet UI', err);
        }
      }
    }
  }), []);

  if (!ready) return null;

  return (
    <Ctx.Provider value={api}>
      {children}
    </Ctx.Provider>
  );
}

export default WalletProvider;
