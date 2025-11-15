import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { fetchGivingBlockCharities } from '../../../utils/givingblock';
import Redis from 'ioredis';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// This endpoint seeds charities from The Giving Block API into the local DB.
// Protected: in production it requires admin auth (via withAdminAuth). In development it can be called directly.
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // In development allow calls without admin header to make local seeding easy.
  const devAllow = process.env.NODE_ENV === 'development';
  if (!devAllow) {
    // when not in development, the wrapper will enforce admin auth
  }

  try {
    const dry = req.query.dry === '1' || req.query.dry === 'true';
    if (!dry) await dbConnect();
    const list = await fetchGivingBlockCharities();
    if (!list || list.length === 0) return res.status(200).json({ ok: true, processed: 0 });

    let inserted = 0, updated = 0;
    for (const raw of list) {
      const c = raw as Record<string, unknown>;
      const name = String(c.name ?? c.organization_name ?? c.title ?? '').trim();
      if (!name) continue;
      const doc: Record<string, unknown> = {
        givingBlockId: String(c.id ?? c.organization_id ?? ''),
        name,
        description: String(c.mission ?? c.description ?? ''),
        website: String(c.website ?? c.url ?? ''),
        logo: String(c.logoUrl ?? c.logo ?? c.logo_url ?? ''),
        givingBlockEmbedUrl: String(c.donationWidget ?? c.donation_widget ?? c.embed ?? ''),
        wallet: String(c.cryptoWalletAddress ?? c.wallet ?? '')
      };

      if (!dry) {
        const r = await Charity.updateOne({ name: String(doc.name ?? '') }, { $set: doc }, { upsert: true });
        const rObj = r as unknown as Record<string, unknown>;
        if (rObj.upserted) inserted++; else updated++;
      } else {
        // in dry-run mode we only simulate counts
        inserted++;
      }
    }

    // best-effort: clear related caches so API picks up new data
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl && redisUrl !== 'DISABLE_REDIS') {
        const client = new Redis(redisUrl);
        await client.del('charities:all');
        await client.del('givingblock:organizations');
        await client.quit();
      }
    } catch {
      // ignore
    }

    return res.status(200).json({ ok: true, inserted, updated });
  } catch (e: unknown) {
    const errMsg = e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'message') ? String((e as Record<string, unknown>)['message']) : String(e);
    return res.status(500).json({ error: errMsg });
  }
}

// Export: in development export raw handler; in other envs wrap with admin auth
let exported: any = handler;
if (process.env.NODE_ENV !== 'development') exported = withAdminAuth(handler);
export default exported;
