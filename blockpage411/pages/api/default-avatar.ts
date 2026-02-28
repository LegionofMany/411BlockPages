import type { NextApiRequest, NextApiResponse } from 'next';

// 1x1 transparent PNG (base64)
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X+VQAAAABJRU5ErkJggg==';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const buf = Buffer.from(PNG_BASE64, 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', String(buf.length));
  // Cache aggressively; it's a stable placeholder.
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(buf);
}
