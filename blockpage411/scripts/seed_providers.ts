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
    const existing = await Provider.findOne({ name: it.name });
    if (existing) {
      console.log('skip', it.name);
      continue;
    }
    await Provider.create({
      name: it.name,
      aliases: it.aliases || [],
      type: it.type || 'CEX',
      website: it.website,
      rank: it.rank,
      seeded: true,
      status: 'seeded',
    });
    console.log('added', it.name);
  }
  process.exit(0);
}

main().catch((err)=>{ console.error(err); process.exit(1); });
