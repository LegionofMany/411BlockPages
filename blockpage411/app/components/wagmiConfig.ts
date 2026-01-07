"use client";

import { createConfig } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { mainnet } from 'viem/chains';
import { http } from 'viem';
import { getReownWagmiConnector } from '../../lib/appkit';

// getWagmiConfig is client-only and cached on the global object to ensure
// a single Wagmi config instance across HMR and re-renders. WalletConnect
// relies on browser WebSocket / window APIs so it must never run during SSR.
export function getWagmiConfig() {
  const g = globalThis as unknown as { __blockpage411_wagmiConfig?: ReturnType<typeof createConfig> };
  if (g.__blockpage411_wagmiConfig) return g.__blockpage411_wagmiConfig;

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!projectId) {
    // In dev warn explicitly if WalletConnect isn't setup. Do not expose secrets.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — WalletConnect QR/connect disabled.');
    }
  }

  // Ensure wallet connectors that rely on browser APIs are only created when
  // running in a real browser environment.
  const connectors: any[] = [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: 'Blockpage411' }),
  ];

  // If Reown provided a wagmi connector during client initialization, prefer
  // it by inserting at index 1. This allows Reown to manage connections and
  // avoids duplicate WalletConnect subscriptions.
  try {
    const reownConnector = typeof window !== 'undefined' ? getReownWagmiConnector() : null;
    if (reownConnector) {
      connectors.splice(1, 0, reownConnector as any);
    } else if (typeof window !== 'undefined' && projectId) {
      connectors.splice(1, 0, walletConnect({ projectId, showQrModal: true }));
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Error checking Reown connector; falling back to default connectors.', err);
    }
    if (typeof window !== 'undefined' && projectId) {
      connectors.splice(1, 0, walletConnect({ projectId, showQrModal: true }));
    }
  }

  g.__blockpage411_wagmiConfig = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
    connectors,
  });

  return g.__blockpage411_wagmiConfig;
}
