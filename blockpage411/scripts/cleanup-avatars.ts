import dbConnect from '../lib/db';
import User from '../lib/userModel';
import Wallet from '../lib/walletModel';
import fs from 'fs';
import path from 'path';

// Script: scan public/uploads/avatars and delete files not referenced by User or Wallet
// Safety: only delete files older than DAYS_THRESHOLD (default 7 days)

const DAYS_THRESHOLD = Number(process.env.CLEANUP_AVATAR_DAYS || '7');

async function main() {
  await dbConnect();
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory, nothing to do.');
    process.exit(0);
  }

  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  if (files.length === 0) {
    console.log('No avatar files found.');
    process.exit(0);
  }

  // Build set of referenced filenames from DB (users and wallets)
  const referenced = new Set<string>();

  const users = await User.find({}).select('avatarUrl socials').lean();
  for (const u of users) {
    const urls = [] as string[];
    if ((u as any).avatarUrl) urls.push((u as any).avatarUrl);
    if ((u as any).socials && (u as any).socials.avatarUrl) urls.push((u as any).socials.avatarUrl);
    for (const url of urls) {
      const m = url && url.match(/uploads\/avatars\/(.+)$/);
      if (m && m[1]) referenced.add(path.basename(m[1]));
      const m2 = url && url.match(/api\/avatar\/(.+)$/);
      if (m2 && m2[1]) referenced.add(path.basename(m2[1]));
    }
  }

  const wallets = await Wallet.find({}).select('socials').lean();
  for (const w of wallets) {
    const url = w && (w as any).socials && (w as any).socials.avatarUrl;
    if (url) {
      const m = url.match(/uploads\/avatars\/(.+)$/);
      if (m && m[1]) referenced.add(path.basename(m[1]));
      const m2 = url.match(/api\/avatar\/(.+)$/);
      if (m2 && m2[1]) referenced.add(path.basename(m2[1]));
    }
  }

  console.log('Found', files.length, 'files; referenced count:', referenced.size);

  const now = Date.now();
  const thresholdMs = DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const f of files) {
    if (referenced.has(f)) continue;
    const full = path.join(uploadsDir, f);
    try {
      const stat = fs.statSync(full);
      if (now - stat.mtimeMs < thresholdMs) {
        // too recent; skip
        continue;
      }
      fs.unlinkSync(full);
      removed++;
      console.log('Removed orphaned avatar:', f);
    } catch (err) {
      console.warn('Failed to remove', full, err);
    }
  }

  console.log('Cleanup complete. Removed', removed, 'files.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
