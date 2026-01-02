"use client";

import { createConfig } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { mainnet } from 'viem/chains';
import { http } from 'viem';

export function getWagmiConfig() {
  const g = globalThis as unknown as { __blockpage411_wagmiConfig?: ReturnType<typeof createConfig> };
  if (g.__blockpage411_wagmiConfig) return g.__blockpage411_wagmiConfig;

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  g.__blockpage411_wagmiConfig = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
    connectors: [
      injected({ shimDisconnect: true }),
      ...(projectId ? [walletConnect({ projectId, showQrModal: true })] : []),
      coinbaseWallet({ appName: 'Blockpage411' }),
    ],
  });

  return g.__blockpage411_wagmiConfig;
}
