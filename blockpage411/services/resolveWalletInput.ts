import { getCache, setCache } from 'lib/redisCache';
import { createPublicClient, http, isAddress, getAddress } from 'viem';
import { mainnet, base } from 'viem/chains';
import Resolution from '@unstoppabledomains/resolution';

export type ResolvedWalletInput = {
  address: string;
  resolvedFrom: 'address' | 'ens' | 'basename' | 'unstoppable';
  chainHint?: 'ethereum' | 'base';
};

const resolution = new Resolution();

const ethereumRpcUrl =
  process.env.ETH_RPC_URL ||
  process.env.NEXT_PUBLIC_ETH_RPC_URL ||
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ||
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  'https://cloudflare-eth.com';

const baseRpcUrl =
  process.env.BASE_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_RPC_URL ||
  'https://mainnet.base.org';

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(ethereumRpcUrl),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(baseRpcUrl),
});

function normalizeQuery(query: string): string {
  return String(query || '').trim();
}

function isProbablyEns(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.eth');
}

function isProbablyBaseName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.base') || lower.endsWith('.cb.id');
}

function isProbablyUnstoppable(name: string): boolean {
  const lower = name.toLowerCase();
  return /\.(crypto|nft|x|wallet|dao|blockchain|bitcoin|888)$/.test(lower);
}

export async function resolveWalletInput(query: string): Promise<ResolvedWalletInput | null> {
  const q = normalizeQuery(query);
  if (!q) return null;

  const cacheKey = `resolve-wallet:v1:${q.toLowerCase()}`;
  try {
    const cached = (await getCache(cacheKey)) as ResolvedWalletInput | null;
    if (cached && typeof cached === 'object' && typeof cached.address === 'string') return cached;
  } catch {
    // ignore
  }

  // Direct address
  if (isAddress(q)) {
    const resolved: ResolvedWalletInput = { address: getAddress(q), resolvedFrom: 'address' };
    try {
      await setCache(cacheKey, resolved, 60 * 60);
    } catch {
      // ignore
    }
    return resolved;
  }

  // Basename (ENS-compatible on Base)
  if (isProbablyBaseName(q)) {
    try {
      const addr = await baseClient.getEnsAddress({ name: q.toLowerCase() });
      if (addr && isAddress(addr)) {
        const resolved: ResolvedWalletInput = {
          address: getAddress(addr),
          resolvedFrom: 'basename',
          chainHint: 'base',
        };
        try {
          await setCache(cacheKey, resolved, 60 * 60);
        } catch {}
        return resolved;
      }
    } catch {
      // ignore
    }
  }

  // ENS
  if (isProbablyEns(q)) {
    try {
      const addr = await ethClient.getEnsAddress({ name: q.toLowerCase() });
      if (addr && isAddress(addr)) {
        const resolved: ResolvedWalletInput = {
          address: getAddress(addr),
          resolvedFrom: 'ens',
          chainHint: 'ethereum',
        };
        try {
          await setCache(cacheKey, resolved, 60 * 60);
        } catch {}
        return resolved;
      }
    } catch {
      // ignore
    }
  }

  // Unstoppable Domains
  if (isProbablyUnstoppable(q)) {
    try {
      const addr = await resolution.addr(q.toLowerCase(), 'ETH');
      if (addr && isAddress(addr)) {
        const resolved: ResolvedWalletInput = {
          address: getAddress(addr),
          resolvedFrom: 'unstoppable',
          chainHint: 'ethereum',
        };
        try {
          await setCache(cacheKey, resolved, 60 * 60);
        } catch {}
        return resolved;
      }
    } catch {
      // ignore
    }
  }

  return null;
}
