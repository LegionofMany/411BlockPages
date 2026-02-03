import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveWalletInput } from 'services/resolveWalletInput';

function toLightningRoute(input: string): { kind: 'lightning'; input: string; route: string } {
  const q = String(input || '').trim();
  return {
    kind: 'lightning',
    input: q,
    route: `/lightning?input=${encodeURIComponent(q)}`,
  };
}

function extractLightningFromBitcoinUri(q: string): string | null {
  const raw = String(q || '').trim();
  if (!/^bitcoin:/i.test(raw)) return null;
  const parts = raw.split('?');
  if (parts.length < 2) return null;
  try {
    const params = new URLSearchParams(parts.slice(1).join('?'));
    const ln = params.get('lightning');
    return ln ? ln.trim() : null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const qRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const q = String(qRaw || '').trim();
  if (!q) return res.status(400).json({ message: 'Missing q' });

  // Lightning inputs are not on-chain addresses, so we can't resolve them to /wallet/bitcoin/:address.
  // Return a helpful message rather than a generic 404.
  const qLower = q.toLowerCase();
  const isLightningUri = qLower.startsWith('lightning:');
  const isLnInvoice = /^(lnbc|lntb|lnbcrt)[0-9a-z]+$/i.test(qLower);
  const isLnurl = /^lnurl1[0-9a-z]+$/i.test(qLower);
  if (isLightningUri || isLnInvoice || isLnurl) {
    const normalized = isLightningUri ? q.replace(/^lightning:/i, '').trim() : q;
    return res.status(200).json(toLightningRoute(normalized));
  }

  // Some wallets share a bitcoin: URI that only contains a lightning param.
  if (qLower.startsWith('bitcoin:') && qLower.includes('lightning=') && !qLower.match(/^bitcoin:[^?]+/i)) {
    const ln = extractLightningFromBitcoinUri(q);
    if (ln) return res.status(200).json(toLightningRoute(ln));
    return res.status(422).json({ message: 'Unable to parse Lightning input from this bitcoin: URI.' });
  }

  try {
    const resolved = await resolveWalletInput(q);
    if (!resolved) return res.status(404).json({ message: 'Unable to resolve input' });
    return res.status(200).json(resolved);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Resolution error' });
  }
}
