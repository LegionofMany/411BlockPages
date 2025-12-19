import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import Pledge from '../../../models/Pledge';
import { logWebhookError } from '../../../lib/logger';
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

  const shortBodyPreview = rawBody.slice(0, 512);

  if (!verifyWebhookSignature(rawBody, signature)) {
    const msg = `[givingblock webhook] invalid signature for payload preview=${shortBodyPreview}`;
    try { logWebhookError(msg); } catch { /* swallow */ }
    // eslint-disable-next-line no-console
    console.warn(msg);
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
      const msg = '[givingblock webhook] failed to parse or decrypt payload';
      try { logWebhookError(msg); } catch { /* swallow */ }
      // eslint-disable-next-line no-console
      console.error(msg);
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
  }

  const eventType = payload?.type || payload?.event;
  const eventId = payload?.id || payload?.eventId || payload?.event_id;
  const baseMeta = `eventType=${String(eventType || '')} eventId=${String(eventId || '')}`;

  // eslint-disable-next-line no-console
  console.info('[givingblock webhook] received', baseMeta);

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

    try {
      const resCharity = await Charity.updateOne(
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
      const msg = `[givingblock webhook] upsert charity charityId=${normalized.charityId} matched=${resCharity.matchedCount} modified=${resCharity.modifiedCount} upserted=${resCharity.upsertedCount || 0}`;
      try { logWebhookError(msg); } catch { /* swallow */ }
      // eslint-disable-next-line no-console
      console.info(msg);
    } catch (err: any) {
      const msg = `[givingblock webhook] failed to upsert charity charityId=${normalized.charityId} error=${err?.message || String(err)}`;
      try { logWebhookError(msg); } catch { /* swallow */ }
      // eslint-disable-next-line no-console
      console.error(msg);
    }
  }

  if (eventType === 'donation.created' || eventType === 'donation.updated') {
    const donation = payload.data || payload.donation || payload;

    const externalId = String(
      donation.id ||
      donation.donationId ||
      donation.donation_id ||
      donation.txHash ||
      donation.tx_hash ||
      '',
    );

    if (!externalId) {
      // Malformed payload; log and skip without failing the whole webhook
      const msg = '[givingblock webhook] donation event missing external id';
      try { logWebhookError(msg); } catch { /* swallow */ }
      // eslint-disable-next-line no-console
      console.warn(msg);
    } else {
      const amountRaw = donation.amount || donation.usdAmount || donation.value || 0;
      const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw) || 0;
      const taxAmountRaw = donation.taxAmount || donation.tax_amount || 0;
      const taxAmount = typeof taxAmountRaw === 'number' ? taxAmountRaw : Number(taxAmountRaw) || 0;
      const currency = String(donation.currency || donation.currencyCode || donation.currency_code || 'USD');
      const donor = donation.donorEmail || donation.donor_email || donation.email || undefined;

      // We do not have a fundraiserId in the GivingBlock payload; use a
      // conventional placeholder and keep the full payload in raw so that
      // future reconciliation logic can associate pledges to fundraisers.
      const fundraiserId = String(
        donation.fundraiserId ||
        donation.fundraiser_id ||
        donation.campaignId ||
        donation.campaign_id ||
        'givingblock',
      );

      try {
        const resPledge = await Pledge.updateOne(
          { fundraiserId, externalId },
          {
            $set: {
              amount,
              taxAmount,
              currency,
              donor,
              status: 'completed',
              raw: { source: 'givingblock', payload: donation },
            },
          },
          { upsert: true },
        );
        const msg = `[givingblock webhook] upsert donation fundraiserId=${fundraiserId} externalId=${externalId} matched=${resPledge.matchedCount} modified=${resPledge.modifiedCount} upserted=${resPledge.upsertedCount || 0}`;
        try { logWebhookError(msg); } catch { /* swallow */ }
        // eslint-disable-next-line no-console
        console.info(msg);
      } catch (err: any) {
        const msg = `[givingblock webhook] failed to upsert donation fundraiserId=${fundraiserId} externalId=${externalId} error=${err?.message || String(err)}`;
        try { logWebhookError(msg); } catch { /* swallow */ }
        // eslint-disable-next-line no-console
        console.error(msg);
      }
    }
  }

  res.status(200).json({ received: true });
}
