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
  const allow = req.query.allow === '1' || req.query.allow === 'true' || process.env.NODE_ENV === 'development';
  if (!allow) return res.status(403).json({ error: 'Seeding is disabled in this environment' });

  const dataPath = path.join(process.cwd(), 'data', 'charities.json');
  if (!fs.existsSync(dataPath)) return res.status(400).json({ error: 'data/charities.json missing' });

  let items = [];
  try { items = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (e) { return res.status(500).json({ error: 'failed to parse data/charities.json' }); }

  try {
    await dbConnect();
    let inserted = 0, updated = 0;
    for (const c of items) {
      const q = { name: c.name };
      const update = { $set: {
        givingBlockId: c.id || c.givingBlockId,
        name: c.name,
        description: c.mission || c.description || '',
        website: c.website || c.url || '',
        logo: c.logoUrl || c.logo || '',
        givingBlockEmbedUrl: c.donationWidget || c.embed || '',
        wallet: c.cryptoWalletAddress || c.wallet || ''
      }};
      const opt = { upsert: true } as any;
      const r = await Charity.updateOne(q, update, opt);
      if ((r as any).upserted) inserted++; else updated++;
    }
    return res.status(200).json({ ok: true, inserted, updated });
  } catch (e: any) {
    console.error('seed-local failed', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
