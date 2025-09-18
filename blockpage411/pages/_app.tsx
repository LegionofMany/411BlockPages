import "../styles/globals.css";
import { WagmiConfig, createConfig } from "wagmi";
import { mainnet } from 'wagmi/chains';
import { http } from 'viem';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: any) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiConfig>
  );
}
