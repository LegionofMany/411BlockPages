"use client";

import { useEffect } from "react";
import { useEvmWallet } from "../../components/EvmWalletProvider";

const KEY = "walletLoginPending";
const ATTEMPT_COOLDOWN_MS = 30_000;

export function useMobileReconnect() {
  const { isConnected, isInitialized, reconnect } = useEvmWallet();

  useEffect(() => {
    if (!isInitialized) return;
    if (typeof window === "undefined") return;

    const pending = window.localStorage.getItem(KEY);
    if (pending && !isConnected) {
      // IMPORTANT (mobile): after deep-linking into a wallet app and returning,
      // React effects can run multiple times while the wallet provider is still
      // initializing. Without a guard this can spam `eth_requestAccounts` and
      // cause repeated permission/sign-in prompts.
      try {
        const match = /^attempted:(\d+)$/.exec(String(pending));
        const lastAttempt = match ? Number(match[1]) : 0;
        if (lastAttempt && Date.now() - lastAttempt < ATTEMPT_COOLDOWN_MS) {
          return;
        }
        window.localStorage.setItem(KEY, `attempted:${Date.now()}`);
      } catch {
        // ignore
      }

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
