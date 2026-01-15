"use client";
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WalletProvider from './WalletProvider';
import EvmWalletProvider from '../../components/EvmWalletProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <EvmWalletProvider>
        <WalletProvider>
          {children}
        </WalletProvider>
      </EvmWalletProvider>
    </QueryClientProvider>
  );
}
