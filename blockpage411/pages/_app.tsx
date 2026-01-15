import "../styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EvmWalletProvider from "../components/EvmWalletProvider";

const queryClient = new QueryClient();

import type { AppProps } from 'next/app';
import React from 'react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <EvmWalletProvider>
        <Component {...pageProps} />
      </EvmWalletProvider>
    </QueryClientProvider>
  );
}
