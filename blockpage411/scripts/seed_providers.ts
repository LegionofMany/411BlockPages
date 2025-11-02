import fs from 'fs';
import path from 'path';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';

async function main() {
  await dbConnect();
  const file = path.join(process.cwd(), 'data', 'providers.json');
  const raw = fs.readFileSync(file, 'utf-8');
  const items = JSON.parse(raw) as Array<any>;
  for (const it of items) {
    // idempotent upsert so re-running the seed is safe
    const doc = {
      name: it.name,
      aliases: it.aliases || [],
      type: it.type || 'CEX',
      website: it.website,
      rank: it.rank,
      seeded: true,
      status: 'seeded',
      updatedAt: new Date(),
    } as any;
    const res = await Provider.findOneAndUpdate({ name: it.name }, { $set: doc, $setOnInsert: { createdAt: new Date() } }, { upsert: true, new: true });
    if (res) console.log('upserted', it.name);
  }
  process.exit(0);
}

main().catch((err)=>{ console.error(err); process.exit(1); });
