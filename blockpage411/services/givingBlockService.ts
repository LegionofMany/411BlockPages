import crypto from 'crypto';
import { CharityDocument } from '../models/Charity';

const API_KEY = process.env.GIVINGBLOCK_API_KEY;
const BASE_URL = process.env.GIVINGBLOCK_BASE_URL || 'https://public-api.sandbox.thegivingblock.com';
const WEBHOOK_SECRET = process.env.GIVINGBLOCK_WEBHOOK_SECRET || '';
const ENCRYPTION_KEY = process.env.GIVINGBLOCK_ENCRYPTION_KEY || '';
const ENCRYPTION_IV = process.env.GIVINGBLOCK_ENCRYPTION_IV || '';

// NOTE: Outbound auth prefers either a static API key (Bearer)
// or the Public API login + refresh token flow. Basic auth is
// handled only in utils/givingblock.ts for the legacy orgs helper.

// New token-based auth credentials (Public API user)
const USERNAME = process.env.GIVINGBLOCK_USERNAME || '';
const PASSWORD = process.env.GIVINGBLOCK_PASSWORD || '';

// In production, prefer the login/refresh flow over a static API key.
if (!API_KEY && (!USERNAME || !PASSWORD)) {
  // eslint-disable-next-line no-console
  console.warn('GivingBlock credentials are not fully configured (no API key and no username/password)');
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
  const res = await authorizedGivingBlockFetch(`/v1/charities?page=${page}`);

  if (!res.ok) {
    let detail = '';
    try {
      const text = await res.text();
      if (text) detail = `: ${text.slice(0, 300)}`;
    } catch {
      // ignore body parse errors
    }
    throw new Error(`GivingBlock API error ${res.status}${detail}`);
  }

  const data = (await res.json()) as { data: GivingBlockCharityApi[]; meta?: { current_page?: number; last_page?: number } };
  const charities = data.data.map(normalizeCharity);
  const current = data.meta?.current_page ?? page;
  const last = data.meta?.last_page ?? current;
  return { charities, hasMore: current < last };
}

// --- Auth helpers for Public API user (login + refresh tokens) ---

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

async function loginAndGetTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  if (!USERNAME || !PASSWORD) {
    throw new Error('GivingBlock username/password are not configured');
  }

  const loginUrl = `${BASE_URL}/v1/login`;
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // API expects fields named `login` and `password` for the Public API user
    body: JSON.stringify({ login: USERNAME, password: PASSWORD }),
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = '';
    try {
      const text = await res.text();
      if (text) detail = `: ${text.slice(0, 300)}`;
    } catch {
      // ignore body parse errors
    }
    throw new Error(`GivingBlock login failed ${res.status}${detail}`);
  }

  const body = (await res.json()) as any;
  const accessToken = body.accessToken || body.access_token;
  const refreshToken = body.refreshToken || body.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error('GivingBlock login response missing access/refresh tokens');
  }

  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  return { accessToken, refreshToken };
}

async function refreshTokens(): Promise<string> {
  if (!cachedRefreshToken) {
    const { accessToken } = await loginAndGetTokens();
    return accessToken;
  }

  const refreshUrl = `${BASE_URL}/v1/refresh-tokens`;
  const res = await fetch(refreshUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: cachedRefreshToken }),
    cache: 'no-store',
  });

  if (!res.ok) {
    // Fallback: clear tokens so next call will re-login
    cachedAccessToken = null;
    cachedRefreshToken = null;
    throw new Error(`GivingBlock refreshTokens failed ${res.status}`);
  }

  const body = (await res.json()) as any;
  const newAccessToken = body.accessToken || body.access_token;
  const newRefreshToken = body.refreshToken || body.refresh_token;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error('GivingBlock refreshTokens response missing access/refresh tokens');
  }

  cachedAccessToken = newAccessToken;
  cachedRefreshToken = newRefreshToken;
  return newAccessToken;
}

async function getAccessToken(): Promise<string | null> {
  // If legacy API key is configured, prefer that path (no token flow).
  if (API_KEY) return null;

  if (cachedAccessToken) return cachedAccessToken;
  const { accessToken } = await loginAndGetTokens();
  return accessToken;
}

async function authorizedGivingBlockFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Legacy behavior: static API key if provided.
  if (API_KEY) {
    return fetch(url, {
      ...init,
      headers: { ...baseHeaders, Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store',
    });
  }

  // Token-based auth: login + refresh token flow.
  let token = await getAccessToken();
  if (!token) {
    throw new Error('GivingBlock access token is not available');
  }

  let res = await fetch(url, {
    ...init,
    headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (res.ok) return res;

  // If token expired, try refresh once based on error code.
  try {
    const cloned = res.clone();
    const errBody = (await cloned.json().catch(() => null)) as any;
    const code = errBody && (errBody.code || errBody.errorCode || errBody.error);
    if (code === 'EXPIREDJWTTOKEN') {
      token = await refreshTokens();
      res = await fetch(url, {
        ...init,
        headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    }
  } catch {
    // ignore JSON parse errors and fall through
  }

  return res;
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
