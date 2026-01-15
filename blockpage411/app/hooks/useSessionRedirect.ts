"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AuthStatus = { authenticated?: boolean };

const PROTECTED_PREFIXES = [
  "/profile",
  "/report",
  "/flag",
  "/rate",
  "/follow-wallet",
  "/admin",
  "/dashboard",
];

function isProtectedPath(pathname: string) {
  if (!pathname) return false;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function useSessionRedirect() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const searchParams = useSearchParams();
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

    const redirectTo = searchParams?.get("redirectTo") || "";
    const fullPath = (() => {
      const qs = searchParams?.toString() || "";
      return qs ? `${pathname}?${qs}` : pathname;
    })();

    if (!authenticated) {
      if (pathname === "/login") return;
      if (!isProtectedPath(pathname)) return;
      const target = `/login?redirectTo=${encodeURIComponent(fullPath)}`;
      router.replace(target);
      return;
    }

    // Authenticated user sitting on /login: send them to /profile first.
    if (authenticated && pathname === "/login") {
      const target = redirectTo ? `/profile?redirectTo=${encodeURIComponent(redirectTo)}` : "/profile";
      router.replace(target);
    }
  }, [authenticated, pathname, ready, router, searchParams]);
}
