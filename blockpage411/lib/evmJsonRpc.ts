import { EVM_CHAINS, type EvmChainId } from './evmChains';

type JsonRpcResponse<T> = { jsonrpc: string; id: number; result?: T; error?: { code: number; message: string; data?: unknown } };

async function fetchWithTimeout(url: string, body: unknown, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`rpc_http_${res.status}`);
    return json;
  } finally {
    clearTimeout(t);
  }
}

export async function evmRpcCall<T>(chain: EvmChainId, method: string, params: unknown[] = [], timeoutMs = 2500): Promise<T | null> {
  const cfg = EVM_CHAINS[chain];
  const urls = Array.isArray(cfg?.rpcUrls) ? cfg.rpcUrls.filter(Boolean) : [];
  if (!urls.length) return null;

  const payload = { jsonrpc: '2.0', id: 1, method, params };

  for (const url of urls) {
    try {
      const json = (await fetchWithTimeout(url, payload, timeoutMs)) as JsonRpcResponse<T> | null;
      if (!json || typeof json !== 'object') continue;
      if ('error' in json && json.error) continue;
      if (!('result' in json)) continue;
      return (json as any).result ?? null;
    } catch {
      // try next url
      continue;
    }
  }

  return null;
}

export function hexToBigInt(hex: string | null | undefined): bigint {
  const h = String(hex || '').trim();
  if (!h) return 0n;
  try {
    return BigInt(h);
  } catch {
    try {
      return BigInt(h.startsWith('0x') ? h : `0x${h}`);
    } catch {
      return 0n;
    }
  }
}

export function hexToNumber(hex: string | null | undefined): number | null {
  const n = hexToBigInt(hex);
  const asNumber = Number(n);
  return Number.isFinite(asNumber) ? asNumber : null;
}
