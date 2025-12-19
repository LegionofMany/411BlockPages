import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const WEBHOOK_URL = process.env.GIVINGBLOCK_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/givingblock`;
const WEBHOOK_SECRET = process.env.GIVINGBLOCK_WEBHOOK_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  if (!WEBHOOK_SECRET) {
    res.status(500).json({ error: 'GIVINGBLOCK_WEBHOOK_SECRET is not configured' });
    return;
  }

  const payload = (req.body && Object.keys(req.body).length > 0) ? req.body : { ...req.query };
  const rawBody = JSON.stringify(payload);

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody, 'utf8');
  const signature = hmac.digest('hex');

  try {
    const forwardRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-givingblock-signature': signature,
      },
      body: rawBody,
    });
    const text = await forwardRes.text();
    res.status(forwardRes.status).send({ status: forwardRes.status, body: text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
