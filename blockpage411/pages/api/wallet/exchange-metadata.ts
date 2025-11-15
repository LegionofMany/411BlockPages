import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const filePath = path.join(process.cwd(), 'data', 'exchangeMetadata.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load metadata' });
  }
}
