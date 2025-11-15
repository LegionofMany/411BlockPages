import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { decryptPayload, normalizeCharity, verifyWebhookSignature } from '../../../services/givingBlockService';

// Disable Next.js body parsing so we can verify signature against raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

function readBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const rawBody = await readBody(req);
  const signature = (req.headers['x-givingblock-signature'] || req.headers['x-giving-block-signature']) as string | undefined;

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  await dbConnect();

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // might be encrypted
    try {
      const decrypted = decryptPayload(rawBody);
      payload = JSON.parse(decrypted);
    } catch {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
  }

  const eventType = payload?.type || payload?.event;

  if (eventType === 'charity.updated' || eventType === 'charity.created') {
    const charityData = payload.data || payload.charity || payload;
    const normalized = normalizeCharity({
      id: String(charityData.id || charityData.charityId || charityData.charity_id || ''),
      name: String(charityData.name || ''),
      description: charityData.description,
      logo: charityData.logo,
      walletAddress: charityData.walletAddress || charityData.wallet || charityData.donationAddress,
      categories: charityData.categories,
    });

    await Charity.updateOne(
      { charityId: normalized.charityId },
      {
        $set: {
          charityId: normalized.charityId,
          name: normalized.name,
          description: normalized.description,
          logo: normalized.logo,
          donationAddress: normalized.donationAddress,
          categories: normalized.categories,
        },
      },
      { upsert: true },
    );
  }

  // Other event types like donation.created could be handled here in the future

  res.status(200).json({ received: true });
}
