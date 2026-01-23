import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { sanitizeDescription } from '../../../services/givingBlockService';
import { getCache, setCache } from '../../../lib/redisCache';
import { withAdminAuth } from '../../../lib/adminMiddleware';

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

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method === 'GET') {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const includeHiddenRaw = String(req.query.includeHidden || '').trim().toLowerCase();
    const includeHidden = includeHiddenRaw === '1' || includeHiddenRaw === 'true' || includeHiddenRaw === 'yes';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSizeRaw = parseInt(String(req.query.pageSize || '24'), 10) || 24;
    const pageSize = Math.min(Math.max(6, pageSizeRaw), 60);

    const filter: Record<string, unknown> = {};
    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }

    if (category) {
      filter.categories = { $in: [category] };
    }

    if (!includeHidden) {
      filter.hidden = { $ne: true };
    }

    const cacheKey = `charities:list:q=${encodeURIComponent(q)}:cat=${encodeURIComponent(category)}:hidden=${includeHidden ? 'all' : 'public'}:p=${page}:s=${pageSize}`;

    try {
      const cached = (await getCache(cacheKey)) as
        | { results: unknown[]; total: number; page: number; pageSize: number }
        | null;
      if (cached && Array.isArray(cached.results)) {
        return res.status(200).json(cached);
      }
    } catch {
      // ignore cache errors
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      Charity.find(filter).sort({ name: 1 }).skip(skip).limit(pageSize).lean(),
      Charity.countDocuments(filter),
    ]);

    const payload = { results: list, total, page, pageSize };

    // cache for 5–15 minutes; use 600s (10 minutes) as a middle ground
    try {
      await setCache(cacheKey, payload, 600);
    } catch {
      // ignore cache errors
    }
    return res.status(200).json(payload);
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const { id, name, website, description, logo, givingBlockId, charityId, tags, categories, givingBlockEmbedUrl, donationAddress } = req.body as {
        id?: string;
        name?: string;
        website?: string;
        description?: string;
        logo?: string;
        givingBlockId?: string;
        charityId?: string;
        tags?: string[];
        categories?: string[];
        givingBlockEmbedUrl?: string;
        donationAddress?: string;
      };

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
      }

      if (req.method === 'POST') {
        const sanitizedDesc = sanitizeDescription(description ?? undefined);
        const created = await Charity.create({
          name,
          website: normalizeHttpUrl(website),
          description: sanitizedDesc,
          logo: normalizeHttpUrl(logo),
          givingBlockId,
          charityId,
          donationAddress,
          givingBlockEmbedUrl: normalizeHttpUrl(givingBlockEmbedUrl),
          tags: Array.isArray(tags) ? tags : undefined,
          categories: Array.isArray(categories) ? categories : undefined,
        });
        return res.status(201).json({ charity: created });
      }

      if (!id) {
        return res.status(400).json({ error: 'id is required for updates' });
      }
      const sanitizedDesc = sanitizeDescription(description ?? undefined);
      const update: any = {
        name,
        website: normalizeHttpUrl(website),
        description: sanitizedDesc,
        logo: normalizeHttpUrl(logo),
        givingBlockId,
        charityId,
      };
      if (Array.isArray(tags)) update.tags = tags;
      if (Array.isArray(categories)) update.categories = categories;
      if (typeof givingBlockEmbedUrl === 'string') update.givingBlockEmbedUrl = normalizeHttpUrl(givingBlockEmbedUrl);
      if (typeof donationAddress === 'string') update.donationAddress = donationAddress;

      const updated = await Charity.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true },
      ).lean();
      if (!updated) return res.status(404).json({ error: 'Charity not found' });
      return res.status(200).json({ charity: updated });
    } catch (e: any) {
      return res
        .status(500)
        .json({ error: e?.message || 'Failed to save charity' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  res.status(405).end('Method Not Allowed');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return baseHandler(req, res);
  return withAdminAuth(baseHandler)(req, res);
}
