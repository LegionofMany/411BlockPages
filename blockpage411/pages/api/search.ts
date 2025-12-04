import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import Wallet from '../../lib/walletModel';
import Resolution from '@unstoppabledomains/resolution';
import { ethers } from 'ethers';

// Types for Wallet document
type WalletDoc = {
  address: string;
  chain: string;
  ens?: string;
  avgRating?: number;
  nftCount?: number;
  blacklisted?: boolean;
  flags?: { reason: string; user: string; date: string }[];
  kycStatus?: string;
};
// Helper to get status tags for a wallet
function getStatusTags(wallet: WalletDoc) {
  const tags: string[] = [];
  if (wallet?.blacklisted) tags.push('Blacklisted');
  if (wallet?.flags && wallet.flags.length > 0) tags.push(`Flagged (${wallet.flags.length})`);
  if (wallet?.kycStatus === 'verified') tags.push('Verified');
  return tags;
}

// Lightweight Unstoppable/ENS-style resolution helper.
// Uses ethers for .eth ENS and Unstoppable Domains SDK for common UD TLDs.
const resolution = new Resolution();

async function resolveDomainToAddress(name: string): Promise<{ address: string; domain: string } | null> {
  const domain = String(name || '').trim();
  if (!domain) return null;

  const lower = domain.toLowerCase();
  const isEns = lower.endsWith('.eth');
  const isUd = /\.(crypto|nft|x|wallet|dao|blockchain|bitcoin|888)$/.test(lower);

  // Prefer ENS resolution via ethers for .eth names
  if (isEns) {
    try {
      const rpcUrl = process.env.ETH_RPC_URL || process.env.NEXT_PUBLIC_ETH_RPC_URL;
      const provider = rpcUrl
        ? new ethers.JsonRpcProvider(rpcUrl)
        : ethers.getDefaultProvider('mainnet');
      const addr = await provider.resolveName(lower);
      if (addr) return { address: addr, domain };
    } catch (e) {
      console.warn('ENS_RESOLUTION_ERROR', { domain, error: (e as Error).message });
    }
  }

  if (isUd) {
    try {
      const addr = await resolution.addr(lower, 'ETH');
      if (!addr) return null;
      return { address: addr, domain };
    } catch (e) {
      console.warn('UNSTOPPABLE_RESOLUTION_ERROR', { domain, error: (e as Error).message });
      return null;
    }
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { q, chain } = req.query;
  // Ensure q and chain are always strings
  q = Array.isArray(q) ? q[0] : q;
  chain = Array.isArray(chain) ? chain[0] : chain;
  await dbConnect();
  let input = (q || '').toString().trim();
  let resolvedDomain: string | undefined;

  // Try resolving Unstoppable-style domains to an address first
  if (input) {
    const resolved = await resolveDomainToAddress(input);
    if (resolved) {
      input = resolved.address;
      resolvedDomain = resolved.domain;
    }
  }

  // Simple search: match address substring, filter by chain if provided
  const query: Record<string, unknown> = { };
  if (input) query.address = { $regex: input, $options: 'i' };
  if (chain) query.chain = chain;
  query.blacklisted = { $ne: true };
  console.log('SEARCH API: query', query);
  const results = await Wallet.find(query).limit(20);
  console.log('SEARCH API: found', results.length, 'results');
  let profiles = results.map((w: WalletDoc) => ({
    address: w.address,
    chain: w.chain,
    ens: w.ens || resolvedDomain,
    avgRating: w.avgRating,
    nftCount: w.nftCount,
    statusTags: getStatusTags(w),
  }));
  // If no results, return a default profile for the searched address/chain
  if (profiles.length === 0 && input && chain) {
    profiles = [{
      address: input,
      chain: chain,
      ens: resolvedDomain,
      avgRating: undefined,
      nftCount: undefined,
      statusTags: [],
    }];
  }
  res.status(200).json({ results: profiles });
}
