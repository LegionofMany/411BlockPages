import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // allow in development or when explicitly allowed via query param
  // Protection guard: prefer SEED_SECRET when set. In development allow without secret for convenience.
  const seedSecret = process.env.SEED_SECRET;
  const providedSecret = String(req.query.secret ?? req.headers['x-seed-secret'] ?? '');
  if (seedSecret) {
    if (providedSecret !== seedSecret) return res.status(403).json({ error: 'Invalid seed secret' });
  } else {
    const allow = req.query.allow === '1' || req.query.allow === 'true' || process.env.NODE_ENV === 'development';
    if (!allow) return res.status(403).json({ error: 'Seeding is disabled in this environment' });
  }

  const dataPath = path.join(process.cwd(), 'data', 'charities.json');
  if (!fs.existsSync(dataPath)) return res.status(400).json({ error: 'data/charities.json missing' });

  let items: unknown[] = [];
  try { items = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as unknown[]; } catch { return res.status(500).json({ error: 'failed to parse data/charities.json' }); }

  try {
    await dbConnect();
    let inserted = 0, updated = 0;
    for (const raw of items) {
      const c = raw as Record<string, unknown>;
      const name = String(c.name ?? '');
      const q = { name };
      const tags = (c as any).tags;
      const categories = (c as any).categories;
      const update: any = { $set: {
        givingBlockId: String(c.id ?? c.givingBlockId ?? ''),
        name,
        description: String(c.mission ?? c.description ?? ''),
        website: String(c.website ?? c.url ?? ''),
        logo: String((c as any).logoUrl ?? (c as any).logo ?? ''),
        givingBlockEmbedUrl: String((c as any).donationWidget ?? (c as any).embed ?? ''),
        wallet: String((c as any).cryptoWalletAddress ?? (c as any).wallet ?? '')
      }};
      if (Array.isArray(tags)) update.$set.tags = tags;
      if (Array.isArray(categories)) update.$set.categories = categories;
      const opt = { upsert: true };
  const r = await Charity.updateOne(q, update, opt);
  const rObj = r as unknown as Record<string, unknown>;
  if (rObj.upserted) inserted++; else updated++;
    }
    return res.status(200).json({ ok: true, inserted, updated });
  } catch (e: unknown) {
    console.error('seed-local failed', e);
    const errMsg = e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'message') ? String((e as Record<string, unknown>)['message']) : String(e);
    return res.status(500).json({ error: errMsg });
  }
}
