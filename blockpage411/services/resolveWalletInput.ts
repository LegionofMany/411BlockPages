import { getCache, setCache } from 'lib/redisCache';
import { createPublicClient, http, isAddress, getAddress } from 'viem';
import { mainnet, base } from 'viem/chains';
import Resolution from '@unstoppabledomains/resolution';
import { PublicKey } from '@solana/web3.js';
import { EVM_CHAIN_PRIORITY, type EvmChainId } from 'lib/evmChains';
import { getEvmTxCount } from 'lib/evmAddressProbe';

export type ResolvedWalletInput = {
  address: string;
  resolvedFrom: 'address' | 'ens' | 'basename' | 'unstoppable';
  chainHint?: 'ethereum' | 'bsc' | 'polygon' | 'base' | 'arbitrum' | 'optimism' | 'bitcoin' | 'solana' | 'tron';
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

function isProbablyBitcoinAddress(addr: string): boolean {
  const a = String(addr || '').trim();
  if (!a) return false;
  // Bech32 (mainnet)
  if (/^bc1[0-9ac-hj-np-z]{11,71}$/i.test(a)) return true;
  // Base58 P2PKH/P2SH (mainnet)
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a);
}

function isProbablyTronAddress(addr: string): boolean {
  const a = String(addr || '').trim();
  // Tron base58check addresses commonly start with T and are 34 chars.
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a);
}

function isProbablySolanaAddress(addr: string): boolean {
  const a = String(addr || '').trim();
  // Quick shape check to avoid try/catch on obvious non-base58 strings.
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return false;
  try {
    const pk = new PublicKey(a);
    // Ensure round-trip to avoid accepting weird padding variants.
    return pk.toBase58() === a;
  } catch {
    return false;
  }
}

export async function resolveWalletInput(query: string): Promise<ResolvedWalletInput | null> {
  const q = normalizeQuery(query);
  if (!q) return null;

  const cacheKey = `resolve-wallet:v2:${q.toLowerCase()}`;
  try {
    const cached = (await getCache(cacheKey)) as ResolvedWalletInput | null;
    if (cached && typeof cached === 'object' && typeof cached.address === 'string') return cached;
  } catch {
    // ignore
  }

  // Non-EVM direct addresses (fast-path, no network)
  if (isProbablySolanaAddress(q)) {
    const resolved: ResolvedWalletInput = { address: q, resolvedFrom: 'address', chainHint: 'solana' };
    try {
      await setCache(cacheKey, resolved, 60 * 60);
    } catch {
      // ignore
    }
    return resolved;
  }

  // Note: some Solana addresses (e.g. "111111...") can overlap with Base58 Bitcoin shapes.
  // Keep Bitcoin detection after Solana.
  if (isProbablyBitcoinAddress(q)) {
    const resolved: ResolvedWalletInput = { address: q, resolvedFrom: 'address', chainHint: 'bitcoin' };
    try {
      await setCache(cacheKey, resolved, 60 * 60);
    } catch {
      // ignore
    }
    return resolved;
  }

  if (isProbablyTronAddress(q)) {
    const resolved: ResolvedWalletInput = { address: q, resolvedFrom: 'address', chainHint: 'tron' };
    try {
      await setCache(cacheKey, resolved, 60 * 60);
    } catch {
      // ignore
    }
    return resolved;
  }

  // Direct address
  if (isAddress(q)) {
    const checksummed = getAddress(q);
    let chainHint: EvmChainId | undefined = undefined;

    // Best-effort chain inference for EVM addresses: pick first chain with txCount>0,
    // otherwise first responsive chain. Keeps navigation from landing on a wrong chain.
    try {
      let best: { chain: EvmChainId; txCount: number } | null = null;
      for (const c of EVM_CHAIN_PRIORITY) {
        const txCount = await getEvmTxCount(c, checksummed, 1500);
        if (txCount == null) continue;
        if (txCount > 0) {
          best = { chain: c, txCount };
          break;
        }
        if (!best) best = { chain: c, txCount };
      }
      if (best) chainHint = best.chain;
    } catch {
      // ignore
    }

    const resolved: ResolvedWalletInput = { address: checksummed, resolvedFrom: 'address', chainHint };
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
