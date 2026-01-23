import dbConnect from '../lib/db';
import Charity from '../models/Charity';
import mongoose from 'mongoose';

function normalizeHttpUrl(urlLike?: string | null): string | undefined {
  const raw = String(urlLike ?? '').trim();
  if (!raw) return undefined;

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `https://${raw.replace(/^\/\/+/, '')}`;
  try {
    const u = new URL(candidate);
    const protocol = u.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

async function main() {
  try {
    await dbConnect();

    const query: Record<string, unknown> = {
      $or: [
        { website: { $exists: true, $ne: '' } },
        { logo: { $exists: true, $ne: '' } },
        { givingBlockEmbedUrl: { $exists: true, $ne: '' } },
      ],
    };

    const cursor = Charity.find(query).select({ website: 1, logo: 1, givingBlockEmbedUrl: 1 }).cursor();

    let scanned = 0;
    let updated = 0;

    for await (const doc of cursor) {
      scanned++;
      const websiteNext = normalizeHttpUrl((doc as any).website);
      const logoNext = normalizeHttpUrl((doc as any).logo);
      const embedNext = normalizeHttpUrl((doc as any).givingBlockEmbedUrl);

      const websitePrev = String((doc as any).website ?? '').trim();
      const logoPrev = String((doc as any).logo ?? '').trim();
      const embedPrev = String((doc as any).givingBlockEmbedUrl ?? '').trim();

      const set: Record<string, unknown> = {};

      // Only write changes when normalization changes value (or removes invalid)
      if ((websiteNext ?? '') !== websitePrev) set.website = websiteNext;
      if ((logoNext ?? '') !== logoPrev) set.logo = logoNext;
      if ((embedNext ?? '') !== embedPrev) set.givingBlockEmbedUrl = embedNext;

      if (Object.keys(set).length > 0) {
        await Charity.updateOne({ _id: doc._id }, { $set: set });
        updated++;
      }
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, scanned, updated }, null, 2));
  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    } catch {
      // ignore close errors
    }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('normalize_charity_urls failed', err);
  process.exitCode = 1;
}).then(() => {
  if (!process.exitCode) process.exitCode = 0;
});
