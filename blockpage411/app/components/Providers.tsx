"use client";
import React from 'react';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from './wagmiConfig';
import { initReownAppKit, getReownWagmiConnector } from '../../lib/appkit';
import { mainnet } from 'viem/chains';
import { http } from 'viem';
import WalletProvider from './WalletProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    function onUnhandled(e: PromiseRejectionEvent) {
      try {
        const msg = (e.reason && (e.reason.message || (e.reason.toString && e.reason.toString()))) || String(e.reason || '');
        if (typeof msg === 'string' && msg.toLowerCase().includes('metamask')) {
          console.warn('MetaMask not available or connection failed — wallet features disabled.', msg);
          try { e.preventDefault(); } catch {}
        }
      } catch (_) {}
    }
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => window.removeEventListener('unhandledrejection', onUnhandled);
  }, []);
  React.useEffect(() => {
    // Initialize Reown AppKit client-side only. This dynamic init avoids any
    // SSR import of WalletConnect networking code which would trigger
    // WebSocket attempts during server rendering. We initialize AppKit and
    // if it provides a wagmi connector we rebuild the Wagmi config once to
    // include it. This ensures hooks like `useAccount` work with Reown.
    let mounted = true;
    (async () => {
      try {
        await initReownAppKit();
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Error initializing Reown AppKit', err);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Wait until client-only initialization completes so the wagmi config can
  // include any Reown-provided connector and avoid double-initializing
  // WalletConnect relays during hydration.
  // Avoid checking `typeof window` in render paths — this can create
  // server/client branching and cause hydration mismatches. Return a
  // stable placeholder while `ready` is false.
  if (!ready) {
    return <div aria-hidden="true">Loading...</div>;
  }

  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
