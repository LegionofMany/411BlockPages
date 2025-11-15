#!/usr/bin/env ts-node
import '../lib/db';
import Charity from '../models/Charity';
import { fetchCharities } from '../services/givingBlockService';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('--dry');

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

      if (dryRun) {
        // eslint-disable-next-line no-console
        console.log('[DRY RUN] would upsert charity', c.charityId, c.name);
        imported++;
        continue;
      }

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

  // eslint-disable-next-line no-console
  console.log('Sync complete', { imported, updated, total: imported + updated });
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Sync failed', err);
  process.exit(1);
});
