import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import Provider from '../../lib/providerModel';
import rateLimit from '../../lib/rateLimit';

// Shape returned to the frontend selector
function serializeProvider(doc: any) {
  return {
    _id: doc._id?.toString(),
    name: doc.name,
    website: doc.website || '',
    rank: doc.rank ?? null,
    reportsCount: doc.reportsCount ?? 0,
  };
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res)) return;
  await dbConnect();

  const q = (req.query.q as string | undefined)?.trim();
  const find: any = {};
  if (q) {
    find.$text = { $search: q };
  }

  const providers = await Provider.find(find)
    .sort({ rank: 1, reportsCount: -1, name: 1 })
    .limit(50)
    .lean();

  res.status(200).json(providers.map(serializeProvider));
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, website, type, aliases } = req.body || {};

  const trimmedName = (name || '').toString().trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
    return res.status(400).json({ message: 'Invalid provider name' });
  }

  const safeType = ['CEX', 'DEX', 'Wallet', 'Other'].includes(type) ? type : 'Other';
  const normalizedAliases = Array.isArray(aliases)
    ? aliases.map((a: unknown) => (typeof a === 'string' ? a.trim() : '')).filter(Boolean)
    : [];

  let normalizedWebsite: string | undefined;
  if (website) {
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      normalizedWebsite = url.toString();
    } catch {
      return res.status(400).json({ message: 'Invalid website URL' });
    }
  }

  await dbConnect();

  // Avoid obvious duplicates (case-insensitive name match)
  const existing = await Provider.findOne({ name: new RegExp(`^${trimmedName}$`, 'i') });
  if (existing) {
    return res.status(200).json(serializeProvider(existing));
  }

  const doc = await Provider.create({
    name: trimmedName,
    website: normalizedWebsite,
    type: safeType,
    aliases: normalizedAliases,
    status: 'pending',
    seeded: false,
  });

  res.status(201).json(serializeProvider(doc));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method not allowed' });
}
