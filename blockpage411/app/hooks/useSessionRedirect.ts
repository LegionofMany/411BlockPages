"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AuthStatus = { authenticated?: boolean };

export function useSessionRedirect() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/auth/status", {
          credentials: "include",
          cache: "no-store",
        });
        const js = (await res.json().catch(() => ({} as AuthStatus))) as AuthStatus;
        if (cancelled) return;
        setAuthenticated(Boolean(js?.authenticated));
      } catch {
        if (cancelled) return;
        setAuthenticated(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    function onAuthChanged() {
      loadStatus();
    }

    loadStatus();
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (authenticated && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [authenticated, pathname, ready, router]);
}
