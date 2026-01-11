"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { BrowserProvider, getAddress } from "ethers";

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
  error: string | null;
  providerType: ProviderType | null;
  provider: Eip1193Provider | null;
  connectMetaMask: () => Promise<void>;
  connectTrustWallet: () => Promise<void>;
  connectCoinbase: () => Promise<void>;
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

export default function EvmWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cbSdkRef = useRef<CoinbaseWalletSDK | null>(null);

  const coinbasePreference = useMemo(
    () => ({
      // Allow both EOAs and Smart Wallets if available.
      options: "all" as const,
    }),
    []
  );

  const setConnected = useCallback(
    (nextProviderType: ProviderType, nextProvider: Eip1193Provider, nextAddress: string | null) => {
      setProviderType(nextProviderType);
      setProvider(nextProvider);
      setAddress(nextAddress);
      setError(null);
      try {
        if (nextAddress) window.localStorage.setItem(STORAGE_WALLET, nextAddress);
        else window.localStorage.removeItem(STORAGE_WALLET);
        window.localStorage.setItem(STORAGE_PROVIDER, nextProviderType);
      } catch {
        // ignore
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    try {
      if (providerType === "coinbase") {
        try {
          await provider?.disconnect?.();
        } catch {
          // ignore
        }
        try {
          provider?.close?.();
        } catch {
          // ignore
        }
      }
    } finally {
      setAddress(null);
      setProviderType(null);
      setProvider(null);
      try {
        window.localStorage.removeItem(STORAGE_WALLET);
        window.localStorage.removeItem(STORAGE_PROVIDER);
      } catch {
        // ignore
      }
    }
  }, [provider, providerType]);

  const connectMetaMask = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const injected = getInjectedEthereum("metamask");
      if (!injected) throw new Error("MetaMask not detected.");

      const accounts = (await injected.request({ method: "eth_requestAccounts" })) as unknown;
      const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
      const nextAddr = normalizeAddress(list[0]);
      if (!nextAddr) throw new Error("No accounts returned from MetaMask.");

      setConnected("injected", injected, nextAddr);
    } finally {
      setIsConnecting(false);
    }
  }, [setConnected]);

  const connectTrustWallet = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      // Trust Wallet browser provides an injected EIP-1193 provider.
      const injected = getInjectedEthereum("trust") || getInjectedEthereum(null);
      if (!injected) throw new Error("Trust Wallet not detected.");

      const accounts = (await injected.request({ method: "eth_requestAccounts" })) as unknown;
      const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
      const nextAddr = normalizeAddress(list[0]);
      if (!nextAddr) throw new Error("No accounts returned from Trust Wallet.");

      setConnected("injected", injected, nextAddr);
    } finally {
      setIsConnecting(false);
    }
  }, [setConnected]);

  const connectCoinbase = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      if (!cbSdkRef.current) {
        cbSdkRef.current = new CoinbaseWalletSDK({
          appName: "Blockpage411",
          appLogoUrl: null,
          appChainIds: [1],
        });
      }

      // Coinbase SDK provider is EIP-1193 compatible.
      const cbProvider = cbSdkRef.current.makeWeb3Provider(coinbasePreference) as unknown;
      if (!isEip1193Provider(cbProvider)) throw new Error("Coinbase provider unavailable.");

      const accounts = (await cbProvider.request({ method: "eth_requestAccounts" })) as unknown;
      const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
      const nextAddr = normalizeAddress(list[0]);
      if (!nextAddr) throw new Error("No accounts returned from Coinbase Wallet.");

      setConnected("coinbase", cbProvider, nextAddr);
    } finally {
      setIsConnecting(false);
    }
  }, [coinbasePreference, setConnected]);

  const getSigner = useCallback(async () => {
    // If we don't have an active provider yet, try injected as a fallback.
    const p = provider || getInjectedEthereum(null);
    if (!p) throw new Error("No wallet provider available.");

    const browserProvider = new BrowserProvider(p as any);
    return browserProvider.getSigner();
  }, [provider]);

  // Restore connection (best-effort) on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      try {
        const savedType = window.localStorage.getItem(STORAGE_PROVIDER) as ProviderType | null;
        if (!savedType) return;

        if (savedType === "injected") {
          const injected = getInjectedEthereum(null);
          if (!injected) return;
          const accounts = (await injected.request({ method: "eth_accounts" })) as unknown;
          const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
          const nextAddr = normalizeAddress(list[0]);
          if (!nextAddr) return;
          setConnected("injected", injected, nextAddr);
          return;
        }

        if (savedType === "coinbase") {
          if (!cbSdkRef.current) {
            cbSdkRef.current = new CoinbaseWalletSDK({ appName: "Blockpage411", appLogoUrl: null, appChainIds: [1] });
          }
          const cbProvider = cbSdkRef.current.makeWeb3Provider(coinbasePreference) as unknown;
          if (!isEip1193Provider(cbProvider)) return;
          const accounts = (await cbProvider.request({ method: "eth_accounts" })) as unknown;
          const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
          const nextAddr = normalizeAddress(list[0]);
          if (!nextAddr) return;
          setConnected("coinbase", cbProvider, nextAddr);
        }
      } catch {
        // ignore
      }
    })();
  }, [coinbasePreference, setConnected]);

  // Keep address in sync when accounts change.
  useEffect(() => {
    if (!provider || typeof provider.on !== "function") return;

    const onAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? (accounts as unknown[]) : [];
      const nextAddr = normalizeAddress(list[0]);
      if (!nextAddr) {
        void disconnect();
        return;
      }
      setAddress(nextAddr);
      try {
        window.localStorage.setItem(STORAGE_WALLET, nextAddr);
      } catch {
        // ignore
      }
    };

    const onDisconnect = () => {
      void disconnect();
    };

    try {
      provider.on("accountsChanged", onAccountsChanged);
      provider.on("disconnect", onDisconnect);
    } catch {
      // ignore
    }

    return () => {
      try {
        provider.removeListener?.("accountsChanged", onAccountsChanged);
        provider.removeListener?.("disconnect", onDisconnect);
      } catch {
        // ignore
      }
    };
  }, [disconnect, provider]);

  const value = useMemo<EvmWalletContextValue>(
    () => ({
      address,
      isConnected: !!address,
      isConnecting,
      error,
      providerType,
      provider,
      connectMetaMask,
      connectCoinbase,
      disconnect,
      getSigner,
    }),
    [
      address,
      connectCoinbase,
      connectMetaMask,
      disconnect,
      error,
      getSigner,
      isConnecting,
      provider,
      providerType,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEvmWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEvmWallet must be used within EvmWalletProvider");
  return ctx;
}
