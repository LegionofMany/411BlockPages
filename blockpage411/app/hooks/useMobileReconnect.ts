"use client";

import { useEffect } from "react";
import { useEvmWallet } from "../../components/EvmWalletProvider";

const KEY = "walletLoginPending";

export function useMobileReconnect() {
  const { isConnected, isInitialized, reconnect } = useEvmWallet();

  useEffect(() => {
    if (!isInitialized) return;
    if (typeof window === "undefined") return;

    const pending = window.localStorage.getItem(KEY);
    if (pending && !isConnected) {
      // Best-effort reconnect: if the user approved in the wallet app,
      // `eth_accounts`/`eth_requestAccounts` should succeed.
      void reconnect({ requestAccountsIfNeeded: true });
      return;
    }

    if (isConnected) {
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        // ignore
      }
    }
  }, [isConnected, isInitialized, reconnect]);
}
