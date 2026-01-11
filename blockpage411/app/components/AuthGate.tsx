"use client";

import { useMobileReconnect } from "../hooks/useMobileReconnect";
import { useSessionRedirect } from "../hooks/useSessionRedirect";

export function AuthGate() {
  useMobileReconnect();
  useSessionRedirect();
  return null;
}
