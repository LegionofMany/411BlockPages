"use client";

export type DeferredAction =
  | {
      type: "flagWallet";
      chain: string;
      address: string;
      reason: string;
      comment?: string;
      createdAt: number;
    }
  | {
      type: "rateWallet";
      chain: string;
      address: string;
      rating: number;
      text?: string;
      createdAt: number;
    }
  | {
      type: "followWallet";
      chain: string;
      address: string;
      createdAt: number;
    }
  | {
      type: "submitReport";
      chain: string;
      suspectAddress: string;
      providerId?: string;
      evidence?: string[];
      createdAt: number;
    };

const KEY = "deferredAction";

type DeferredActionInput = DeferredAction extends infer T
  ? T extends { createdAt: number }
    ? Omit<T, 'createdAt'>
    : never
  : never;

export function setDeferredAction(action: DeferredActionInput) {
  if (typeof window === "undefined") return;
  try {
    const withTs = { ...action, createdAt: Date.now() } as DeferredAction;
    window.localStorage.setItem(KEY, JSON.stringify(withTs));
  } catch {
    // ignore
  }
}

export function readDeferredAction(): DeferredAction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeferredAction;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDeferredAction() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function consumeDeferredAction(maxAgeMs = 15 * 60 * 1000): DeferredAction | null {
  const a = readDeferredAction();
  if (!a) return null;
  try {
    if (typeof a.createdAt !== "number") {
      clearDeferredAction();
      return null;
    }
    if (Date.now() - a.createdAt > maxAgeMs) {
      clearDeferredAction();
      return null;
    }
  } catch {
    clearDeferredAction();
    return null;
  }
  clearDeferredAction();
  return a;
}
