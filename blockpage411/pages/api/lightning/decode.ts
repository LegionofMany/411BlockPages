import type { NextApiRequest, NextApiResponse } from 'next';
import bolt11 from 'bolt11';
import { bech32 } from 'bech32';

type InvoiceNetwork = 'mainnet' | 'testnet' | 'regtest' | 'unknown';

function normalizeLightningInput(raw: string): string {
  const q = String(raw || '').trim();
  if (!q) return '';

  // lightning:<invoice|lnurl>
  if (/^lightning:/i.test(q)) return q.replace(/^lightning:/i, '').trim();

  // bitcoin:<addr>?lightning=<invoice|lnurl> (sometimes no on-chain address)
  if (/^bitcoin:/i.test(q) && q.includes('?')) {
    const queryString = q.split('?')[1] || '';
    try {
      const params = new URLSearchParams(queryString);
      const ln = params.get('lightning');
      if (ln) return ln.trim();
    } catch {
      // ignore
    }
  }

  return q;
}

function guessInvoiceNetwork(invoiceLower: string): InvoiceNetwork {
  if (invoiceLower.startsWith('lnbc')) return 'mainnet';
  if (invoiceLower.startsWith('lntb')) return 'testnet';
  if (invoiceLower.startsWith('lnbcrt')) return 'regtest';
  return 'unknown';
}

function decodeLnurlToUrl(lnurl: string): string {
  const decoded = bech32.decode(lnurl, 2000);
  if (decoded.prefix.toLowerCase() !== 'lnurl') {
    throw new Error('Invalid LNURL prefix');
  }
  const bytes = Buffer.from(bech32.fromWords(decoded.words));
  const url = bytes.toString('utf8');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('LNURL did not decode to a URL');
  }
  return url;
}

function tagsToObject(tags: any[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const t of tags || []) {
    const key = String(t?.tagName || '').trim();
    if (!key) continue;
    out[key] = t?.data;
  }
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const qRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const q = normalizeLightningInput(String(qRaw || ''));
  if (!q) return res.status(400).json({ message: 'Missing q' });

  const qLower = q.toLowerCase();

  try {
    // LNURL bech32
    if (/^lnurl1[0-9a-z]+$/i.test(qLower)) {
      const url = decodeLnurlToUrl(q);
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await r.json().catch(() => null);

      return res.status(200).json({
        kind: 'lnurl',
        lnurl: q,
        url,
        httpStatus: r.status,
        endpoint: data,
      });
    }

    // LNURL as direct URL (often for LNURLp)
    if (/^https?:\/\//i.test(q)) {
      const r = await fetch(q, { headers: { Accept: 'application/json' } });
      const data = await r.json().catch(() => null);
      return res.status(200).json({
        kind: 'lnurl',
        url: q,
        httpStatus: r.status,
        endpoint: data,
      });
    }

    // BOLT11 invoice
    if (/^(lnbc|lntb|lnbcrt)[0-9a-z]+$/i.test(qLower)) {
      const decoded = bolt11.decode(q);
      const tags = tagsToObject((decoded as any)?.tags || []);
      const network = guessInvoiceNetwork(qLower);

      const millisatoshis =
        typeof (decoded as any)?.millisatoshis === 'string'
          ? (decoded as any).millisatoshis
          : typeof (decoded as any)?.millisatoshis === 'number'
            ? String((decoded as any).millisatoshis)
            : undefined;

      const satoshis =
        typeof (decoded as any)?.satoshis === 'number'
          ? (decoded as any).satoshis
          : millisatoshis
            ? Math.floor(Number(millisatoshis) / 1000)
            : undefined;

      return res.status(200).json({
        kind: 'invoice',
        network,
        invoice: q,
        timestamp: (decoded as any)?.timestamp ? Number((decoded as any).timestamp) : undefined,
        payeeNodeKey: (decoded as any)?.payeeNodeKey,
        amountSats: satoshis,
        amountMsat: millisatoshis,
        tags,
      });
    }

    return res.status(422).json({ message: 'Not a recognized Lightning invoice or LNURL.' });
  } catch (e: any) {
    return res.status(422).json({ message: e?.message || 'Failed to decode Lightning input.' });
  }
}
