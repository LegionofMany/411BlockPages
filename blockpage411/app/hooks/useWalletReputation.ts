"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RiskApiResponse = {
  score?: number;
  category?: string;
};

type CacheEntry = {
  at: number;
  data: { riskScore: number; riskCategory: string | null };
};

const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry["data"]>>();

function keyOf(chain: string, address: string) {
  return `${chain.toLowerCase()}:${address.toLowerCase()}`;
}

async function fetchRisk(chain: string, address: string): Promise<CacheEntry["data"]> {
  const res = await fetch(`/api/wallet/risk?chain=${encodeURIComponent(chain)}&address=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error(`Risk lookup failed (${res.status})`);
  const json = (await res.json()) as RiskApiResponse;

  const riskScore = typeof json?.score === "number" && Number.isFinite(json.score)
    ? Math.max(0, Math.min(100, Math.round(json.score)))
    : 0;

  const riskCategory = typeof json?.category === "string" ? json.category : null;
  return { riskScore, riskCategory };
}

export function useWalletReputation(params: {
  chain: string;
  address: string;
  enabled?: boolean;
}) {
  const { chain, address, enabled = true } = params;
  const cacheKey = useMemo(() => keyOf(chain, address), [chain, address]);

  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskCategory, setRiskCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reputationScore = useMemo(() => {
    if (riskScore == null) return null;
    return Math.max(0, Math.min(100, 100 - riskScore));
  }, [riskScore]);

  const load = useCallback(async () => {
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.at < CACHE_TTL_MS) {
      setRiskScore(cached.data.riskScore);
      setRiskCategory(cached.data.riskCategory);
      return;
    }

    const existingInflight = inflight.get(cacheKey);
    if (existingInflight) {
      setIsLoading(true);
      try {
        const data = await existingInflight;
        setRiskScore(data.riskScore);
        setRiskCategory(data.riskCategory);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const p = fetchRisk(chain, address);
    inflight.set(cacheKey, p);

    try {
      const data = await p;
      cache.set(cacheKey, { at: now, data });
      setRiskScore(data.riskScore);
      setRiskCategory(data.riskCategory);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      inflight.delete(cacheKey);
      setIsLoading(false);
    }
  }, [address, cacheKey, chain]);

  useEffect(() => {
    if (!enabled) return;
    if (!chain || !address) return;
    void load();
  }, [enabled, chain, address, load]);

  return {
    riskScore,
    riskCategory,
    reputationScore,
    isLoading,
    error,
    prefetch: load,
  };
}
