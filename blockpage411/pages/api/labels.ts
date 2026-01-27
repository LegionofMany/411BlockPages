import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import ProviderWallet from 'lib/providerWalletModel';
import Provider from 'lib/providerModel';
import Wallet from 'lib/walletModel';
import { getCache, setCache } from 'lib/redisCache';
import redisRateLimit from 'lib/redisRateLimit';

// Best-effort address label lookup.
// Assumptions:
// - "Exchange" recognition is driven by internal datasets (ProviderWallet + Provider) and optional manual tags (Wallet.exchangeSource).
// - If the dataset does not contain an exchange's cluster addresses, we cannot reliably label it.

type Label = { name: string; type: 'Exchange' | 'Provider' | 'Other' };

type ResponseShape = {
  chain: string;
  labels: Record<string, Label | null>;
};

function normalizeAddr(a: string): string {
  return String(a || '').trim().toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseShape | { message: string }>) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  // Rate limit per-IP
  try {
    const ok = await redisRateLimit(req, res, { windowSec: 60, max: 60 });
    if (!ok) return;
  } catch {
    // permissive if rate limiter fails
  }

  const chain = String((Array.isArray(req.query.chain) ? req.query.chain[0] : req.query.chain) || '').toLowerCase();
  const addressesRaw = String((Array.isArray(req.query.addresses) ? req.query.addresses[0] : req.query.addresses) || '');
  if (!chain) return res.status(400).json({ message: 'chain required' });

  const addrs = Array.from(
    new Set(
      addressesRaw
        .split(',')
        .map((a) => normalizeAddr(a))
        .filter(Boolean)
        .slice(0, 50),
    ),
  );

  const cacheKey = `labels:v1:${chain}:${addrs.join(',')}`;
  try {
    const cached = (await getCache(cacheKey)) as any;
    if (cached && typeof cached === 'object') {
      try {
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      } catch {}
      return res.status(200).json(cached);
    }
  } catch {
    // ignore
  }

  await dbConnect();

  const labels: Record<string, Label | null> = {};
  for (const a of addrs) labels[a] = null;

  try {
    const pws = (await ProviderWallet.find({ chain: String(chain).toLowerCase(), address: { $in: addrs } }).lean()) as any[];
    const providerIds = Array.from(new Set(pws.map((x) => String(x?.providerId || '')).filter(Boolean)));
    const providers = providerIds.length
      ? ((await Provider.find({ _id: { $in: providerIds } }).select('name type').lean()) as any[])
      : [];

    const providerById = new Map<string, { name: string; type: string }>();
    for (const p of providers) {
      const id = String(p?._id || '');
      if (!id) continue;
      providerById.set(id, { name: String(p?.name || ''), type: String(p?.type || 'Other') });
    }

    for (const pw of pws) {
      const a = normalizeAddr(String(pw?.address || ''));
      const prov = providerById.get(String(pw?.providerId || ''));
      if (!a || !prov?.name) continue;
      const type = prov.type === 'CEX' || prov.type === 'Exchange' ? 'Exchange' : 'Provider';
      labels[a] = { name: prov.name, type };
    }

    // Fallback: Wallet.exchangeSource manual tag
    const tagged = (await Wallet.find({ chain, address: { $in: addrs } }).select('address exchangeSource').lean()) as any[];
    for (const w of tagged) {
      const a = normalizeAddr(String(w?.address || ''));
      const ex = typeof w?.exchangeSource === 'string' ? String(w.exchangeSource).trim() : '';
      if (!a || !ex) continue;
      if (!labels[a]) labels[a] = { name: ex, type: 'Exchange' };
    }
  } catch {
    // ignore
  }

  const payload: ResponseShape = { chain, labels };

  try {
    await setCache(cacheKey, payload, 60);
  } catch {
    // ignore
  }

  try {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  } catch {}

  return res.status(200).json(payload);
}
