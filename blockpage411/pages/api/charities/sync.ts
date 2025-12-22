import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { isAdminRequest } from '../../../lib/admin';
import Charity from '../../../models/Charity';
import { fetchCharities } from '../../../services/givingBlockService';

// Maximum runtime for a single sync invocation (in milliseconds).
const MAX_SYNC_DURATION_MS = 10 * 60 * 1000; // 10 minutes
// Number of records per bulkWrite batch. Tune based on DB performance.
const BULK_BATCH_SIZE = 500;

async function runSync() {
  const startedAt = Date.now();
  let imported = 0;
  let updated = 0;

  // eslint-disable-next-line no-console
  console.log('[CharitiesSync] Starting sync');

  // fetchCharities currently returns the full list in one call.
  const { charities } = await fetchCharities(1);
  if (!charities.length) {
    // eslint-disable-next-line no-console
    console.log('[CharitiesSync] No charities returned from GivingBlock');
    return { imported, updated, total: 0 };
  }

  // Process in bulkWrite batches to minimize round trips.
  for (let i = 0; i < charities.length; i += BULK_BATCH_SIZE) {
    const now = Date.now();
    if (now - startedAt > MAX_SYNC_DURATION_MS) {
      // eslint-disable-next-line no-console
      console.warn('[CharitiesSync] Aborting sync due to max duration exceeded', {
        elapsedMs: now - startedAt,
        processed: i,
        total: charities.length,
      });
      break;
    }

    const batch = charities.slice(i, i + BULK_BATCH_SIZE);
    const ops = batch.map((c) => ({
      updateOne: {
        filter: { charityId: c.charityId },
        update: {
          $set: {
            charityId: c.charityId,
            name: c.name,
            description: c.description,
            logo: c.logo,
            donationAddress: c.donationAddress,
            categories: c.categories,
          },
        },
        upsert: true,
      },
    }));

    const res = await Charity.bulkWrite(ops, { ordered: false });

    imported += res.upsertedCount || 0;
    // modifiedCount may be undefined in some driver versions; default to 0.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modifiedCount = (res as any).modifiedCount ?? 0;
    updated += modifiedCount;

    // Basic progress logging every batch.
    // eslint-disable-next-line no-console
    console.log('[CharitiesSync] Batch processed', {
      batchStart: i,
      batchSize: batch.length,
      importedSoFar: imported,
      updatedSoFar: updated,
    });
  }

  const summary = { imported, updated, total: imported + updated };
  // eslint-disable-next-line no-console
  console.log('[CharitiesSync] Completed sync', summary);
  return summary;
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
