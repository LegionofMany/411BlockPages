/**
 * Usage:
 *  - Dry run: ts-node scripts/migrate_fundraisers.ts --dry
 *  - Apply:   ts-node scripts/migrate_fundraisers.ts --apply
 */
// Load environment variables when running this script directly (e.g. npx ts-node)
// Load dotenv explicitly so this script works when executed directly.
 
const dotenv = require('dotenv');
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });

const dbConnect = require('../lib/db').default;
const User = require('../lib/userModel').default;
const Fundraiser = require('../models/Fundraiser').default;

async function run() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const apply = args.includes('--apply');
  if (!dry && !apply) {
    console.log('Provide --dry or --apply');
    process.exit(1);
  }
  await dbConnect();
  const users = await User.find({ 'fundraisers.0': { $exists: true } }).lean();
  console.log(`Found ${users.length} users with embedded fundraisers`);
  let toCreate = 0;
  type EmbeddedFundraiser = {
    id: string;
    title?: string;
    description?: string;
    target?: number | string;
    raised?: number | string;
    walletAddress?: string;
    createdAt?: Date | string;
    expiresAt?: Date | string | null;
    active?: boolean;
    privacy?: string;
    circle?: string[];
  };

  for (const u of users) {
    const userRec = (u && typeof u === 'object') ? (u as Record<string, unknown>) : {};
    const farr = Array.isArray(userRec.fundraisers) ? (userRec.fundraisers as unknown[]) : [];
    for (const fRaw of farr) {
      const f = (fRaw && typeof fRaw === 'object') ? (fRaw as EmbeddedFundraiser) : ({} as EmbeddedFundraiser);
      const exists = await Fundraiser.findOne({ id: f.id }).lean();
      if (exists) continue;
      toCreate++;
      console.log(`Would create fundraiser ${f.id} title='${f.title}' owner=${String(userRec.address)}`);
      if (apply) {
        await Fundraiser.create({
          id: f.id,
          title: f.title,
          description: f.description ?? '',
          target: Number(f.target) || 0,
          raised: Number(f.raised) || 0,
          walletAddress: f.walletAddress,
          owner: String(userRec.address || ''),
          createdAt: f.createdAt || new Date(),
          expiresAt: f.expiresAt || null,
          active: f.active !== undefined ? f.active : true,
          privacy: f.privacy || 'public',
          circle: f.circle || [],
        });
      }
    }
  }
  console.log(`To create: ${toCreate}`);
  if (apply) console.log('Applied migration');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(2); });
