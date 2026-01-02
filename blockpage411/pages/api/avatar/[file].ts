import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;
  if (!file || Array.isArray(file)) return res.status(400).end('Bad request');
  // Sanitize filename to avoid path traversal
  const filename = path.basename(file);
  const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);
  if (!fs.existsSync(filePath)) return res.status(404).end('Not found');

  try {
    const stat = fs.statSync(filePath);
    // set strong caching headers for avatars (CDN/public cache friendly)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'); // 1 day, allow stale while revalidate
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', String(stat.size));
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('/api/avatar/[file] error', err);
    res.status(500).end('Server error');
  }
}
