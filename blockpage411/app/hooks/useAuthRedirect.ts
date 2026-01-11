"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEvmWallet } from "../../components/EvmWalletProvider";

export function useAuthRedirect() {
  const { isConnected, isInitialized } = useEvmWallet();
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    // Wait until the wallet provider has attempted to restore from storage/injected providers.
    // This prevents redirect loops/flicker on mobile return.
    if (!isInitialized) return;

    if (!isConnected && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (isConnected && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [isConnected, isInitialized, pathname, router]);
}
