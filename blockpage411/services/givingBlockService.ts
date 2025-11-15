import crypto from 'crypto';
import { CharityDocument } from '../models/Charity';

const API_KEY = process.env.GIVINGBLOCK_API_KEY;
const BASE_URL = process.env.GIVINGBLOCK_BASE_URL || 'https://public-api.sandbox.thegivingblock.com';
const WEBHOOK_SECRET = process.env.GIVINGBLOCK_WEBHOOK_SECRET || '';
const ENCRYPTION_KEY = process.env.GIVINGBLOCK_ENCRYPTION_KEY || '';
const ENCRYPTION_IV = process.env.GIVINGBLOCK_ENCRYPTION_IV || '';

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('GIVINGBLOCK_API_KEY is not set');
}

export interface GivingBlockCharityApi {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  walletAddress?: string | null;
  categories?: string[] | null;
  [key: string]: unknown;
}

export interface NormalizedCharity {
  charityId: string;
  name: string;
  description?: string;
  logo?: string;
  donationAddress?: string;
  categories?: string[];
}

export async function fetchCharities(page = 1): Promise<{ charities: NormalizedCharity[]; hasMore: boolean }> {
  const url = `${BASE_URL}/v1/charities?page=${page}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GivingBlock API error ${res.status}`);
  }

  const data = (await res.json()) as { data: GivingBlockCharityApi[]; meta?: { current_page?: number; last_page?: number } };
  const charities = data.data.map(normalizeCharity);
  const current = data.meta?.current_page ?? page;
  const last = data.meta?.last_page ?? current;
  return { charities, hasMore: current < last };
}

export function normalizeCharity(apiCharity: GivingBlockCharityApi): NormalizedCharity {
  return {
    charityId: apiCharity.id,
    name: apiCharity.name,
    description: apiCharity.description ?? undefined,
    logo: apiCharity.logo ?? undefined,
    donationAddress: apiCharity.walletAddress ?? undefined,
    categories: apiCharity.categories ?? undefined,
  };
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody, 'utf8');
  const expected = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signatureHeader, 'hex'));
  } catch {
    return false;
  }
}

export function decryptPayload(encryptedBase64: string): string {
  if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
    throw new Error('Encryption key/iv not configured');
  }
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ENCRYPTION_IV, 'hex');
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
