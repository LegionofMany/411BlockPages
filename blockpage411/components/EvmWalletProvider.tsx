"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BrowserProvider, getAddress } from "ethers";
import { WagmiProvider, useAccount, useConnect, useDisconnect, useReconnect } from 'wagmi';
import { coinbaseConnector, injectedConnector, wagmiConfig } from './wagmi/config';

type JsonRpcRequest = { method: string; params?: unknown[] | Record<string, unknown> };

export type Eip1193Provider = {
  request: (req: JsonRpcRequest) => Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
  disconnect?: () => void | Promise<void>;
  close?: () => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  providers?: unknown[];
};

type ProviderType = "injected" | "coinbase";

type EvmWalletContextValue = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: string | null;
  providerType: ProviderType | null;
  provider: Eip1193Provider | null;
  connectMetaMask: () => Promise<void>;
  connectTrustWallet: () => Promise<void>;
  connectBifrost: () => Promise<void>;
  connectCoinbase: () => Promise<void>;
  reconnect: (opts?: { requestAccountsIfNeeded?: boolean }) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getSigner: () => Promise<Awaited<ReturnType<BrowserProvider["getSigner"]>>>;
};

const Ctx = createContext<EvmWalletContextValue | null>(null);

function normalizeAddress(maybe: unknown): string | null {
  if (typeof maybe !== "string" || !maybe) return null;
  try {
    return getAddress(maybe);
  } catch {
    return maybe.toLowerCase();
  }
}

function isEip1193Provider(p: unknown): p is Eip1193Provider {
  return !!p && typeof p === "object" && typeof (p as any).request === "function";
}

type InjectedPreference = "metamask" | "trust" | "coinbase" | null;

function getInjectedEthereum(prefer: InjectedPreference = null): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;

  // Some environments expose multiple providers. Prefer the requested one.
  if (Array.isArray(eth.providers) && prefer) {
    const match = eth.providers.find((p: any) => {
      if (!p) return false;
      if (prefer === "metamask") return !!p.isMetaMask;
      if (prefer === "coinbase") return !!p.isCoinbaseWallet;
      if (prefer === "trust") return !!p.isTrust || !!p.isTrustWallet;
      return false;
    });
    if (isEip1193Provider(match)) return match;
  }

  return isEip1193Provider(eth) ? (eth as Eip1193Provider) : null;
}

const STORAGE_WALLET = "wallet";
const STORAGE_PROVIDER = "walletProvider";

function EvmWalletContextProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address: wagmiAddress, isConnected, connector } = useAccount();
  const { connectAsync, isPending: isConnecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { reconnectAsync } = useReconnect();

  const persistProviderChoice = useCallback((nextProviderType: ProviderType, nextAddress: string | null) => {
    try {
      if (nextAddress) window.localStorage.setItem(STORAGE_WALLET, nextAddress);
      else window.localStorage.removeItem(STORAGE_WALLET);
      window.localStorage.setItem(STORAGE_PROVIDER, nextProviderType);
    } catch {
      // ignore
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync();
    } catch {
      // ignore
    }
    setAddress(null);
    setProviderType(null);
    setProvider(null);
    try {
      window.localStorage.removeItem(STORAGE_WALLET);
      window.localStorage.removeItem(STORAGE_PROVIDER);
    } catch {
      // ignore
    }
  }, [disconnectAsync]);

  const connectMetaMask = useCallback(async () => {
    setError(null);
    try {
      const result = await connectAsync({ connector: injectedConnector });
      const nextAddr = normalizeAddress(result.accounts?.[0]);
      setProviderType('injected');
      if (nextAddr) persistProviderChoice('injected', nextAddr);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect');
      throw e;
    }
  }, [connectAsync, persistProviderChoice]);

  const connectTrustWallet = useCallback(async () => {
    setError(null);
    try {
      // Trust Wallet is an injected provider in most environments.
      const result = await connectAsync({ connector: injectedConnector });
      const nextAddr = normalizeAddress(result.accounts?.[0]);
      setProviderType('injected');
      if (nextAddr) persistProviderChoice('injected', nextAddr);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect');
      throw e;
    }
  }, [connectAsync, persistProviderChoice]);

  const connectBifrost = useCallback(async () => {
    setError(null);
    try {
      // Bifrost (and many mobile wallets) expose an injected provider.
      const result = await connectAsync({ connector: injectedConnector });
      const nextAddr = normalizeAddress(result.accounts?.[0]);
      setProviderType('injected');
      if (nextAddr) persistProviderChoice('injected', nextAddr);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect');
      throw e;
    }
  }, [connectAsync, persistProviderChoice]);

  const connectCoinbase = useCallback(async () => {
    setError(null);
    try {
      const result = await connectAsync({ connector: coinbaseConnector });
      const nextAddr = normalizeAddress(result.accounts?.[0]);
      setProviderType('coinbase');
      if (nextAddr) persistProviderChoice('coinbase', nextAddr);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect');
      throw e;
    }
  }, [connectAsync, persistProviderChoice]);

  const reconnect = useCallback(
    async (opts?: { requestAccountsIfNeeded?: boolean }) => {
      const requestAccountsIfNeeded = Boolean(opts?.requestAccountsIfNeeded);
      try {
        if (isConnected && wagmiAddress) return true;

        // Silent reconnect should not trigger a permission popup.
        const result = await reconnectAsync();
        const nextAddr = normalizeAddress(result?.accounts?.[0] || wagmiAddress);
        if (nextAddr) return true;

        // If explicit user action is allowed, request accounts now.
        if (requestAccountsIfNeeded) {
          await connectAsync({ connector: injectedConnector });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [connectAsync, isConnected, reconnectAsync, wagmiAddress]
  );

  const getSigner = useCallback(async () => {
    // If we don't have an active provider yet, try injected as a fallback.
    const p = provider || getInjectedEthereum(null);
    if (!p) throw new Error("No wallet provider available.");

    const browserProvider = new BrowserProvider(p as any);
    return browserProvider.getSigner();
  }, [provider]);

  // Keep our local state in sync with wagmi account state.
  useEffect(() => {
    const nextAddr = normalizeAddress(wagmiAddress);
    setAddress(nextAddr);
  }, [wagmiAddress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!connector) {
          if (!cancelled) setProvider(null);
          return;
        }
        const p = (await connector.getProvider()) as unknown;
        if (!cancelled) setProvider(isEip1193Provider(p) ? (p as Eip1193Provider) : null);
      } catch {
        if (!cancelled) setProvider(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connector]);

  // Best-effort silent reconnect on mount.
  useEffect(() => {
    (async () => {
      try {
        await reconnect({ requestAccountsIfNeeded: false });
      } finally {
        setIsInitialized(true);
      }
    })();
  }, [reconnect]);

  const value = useMemo<EvmWalletContextValue>(
    () => ({
      address,
      isConnected: !!address,
      isConnecting,
      isInitialized,
      error,
      providerType,
      provider,
      connectMetaMask,
      connectTrustWallet,
      connectBifrost,
      connectCoinbase,
      reconnect,
      disconnect,
      getSigner,
    }),
    [
      address,
      connectCoinbase,
      connectMetaMask,
      connectTrustWallet,
      connectBifrost,
      disconnect,
      error,
      getSigner,
      isConnecting,
      isInitialized,
      provider,
      providerType,
      reconnect,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export default function EvmWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <EvmWalletContextProvider>{children}</EvmWalletContextProvider>
    </WagmiProvider>
  );
}

export function useEvmWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEvmWallet must be used within EvmWalletProvider");
  return ctx;
}
