import "../styles/globals.css";
import { WagmiProvider, createConfig } from "wagmi";
import { mainnet } from 'viem/chains';
import { http } from 'viem';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const chains = [mainnet] as const;

const queryClient = new QueryClient();

// Minimal config used during SSR / initial render (no connectors)
const minimalConfig = createConfig({
  ssr: true,
  chains,
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [],
}) as any;

import type { AppProps } from 'next/app';
import React, { useEffect, useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [clientConfig, setClientConfig] = useState<any>(() => minimalConfig);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const connectorsModule = await import('wagmi/connectors');
        const { injected, walletConnect, coinbaseWallet } = connectorsModule as any;
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        const cfg = createConfig({
          ssr: true,
          chains,
          transports: {
            [mainnet.id]: http(),
          },
          connectors: [
            injected({ shimDisconnect: true }),
            ...(projectId ? [walletConnect({ projectId, showQrModal: true })] : []),
            coinbaseWallet({ appName: 'Blockpage411' }),
          ],
        }) as any;
        if (mounted) setClientConfig(cfg);
      } catch (err) {
        // dynamic import failed; keep minimal config
        // console.warn('Failed to load wagmi connectors dynamically', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <WagmiProvider config={clientConfig}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
