import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { isAdminRequest } from '../../../lib/admin';
import Charity from '../../../models/Charity';
import { fetchCharities } from '../../../services/givingBlockService';

async function runSync() {
  let page = 1;
  let imported = 0;
  let updated = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { charities, hasMore } = await fetchCharities(page);
    if (!charities.length) break;

    for (const c of charities) {
      const update = {
        charityId: c.charityId,
        name: c.name,
        description: c.description,
        logo: c.logo,
        donationAddress: c.donationAddress,
        categories: c.categories,
      };

      const res = await Charity.updateOne(
        { charityId: c.charityId },
        { $set: update },
        { upsert: true },
      );

      if (res.upsertedCount && res.upsertedCount > 0) {
        imported++;
      } else if (res.modifiedCount && res.modifiedCount > 0) {
        updated++;
      }
    }

    if (!hasMore) break;
    page += 1;
  }

  return { imported, updated, total: imported + updated };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const summary = await runSync();
  res.status(200).json(summary);
}
