"use client";

import { useMobileReconnect } from "../hooks/useMobileReconnect";
import { useSessionRedirect } from "../hooks/useSessionRedirect";
import AuthModalHost from "./auth/AuthModalHost";

export function AuthGate() {
  useMobileReconnect();
  useSessionRedirect();
  return <AuthModalHost />;
}
