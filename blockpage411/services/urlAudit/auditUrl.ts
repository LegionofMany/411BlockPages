import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';
import { runDynamicSandbox } from './dynamicSandbox';
import { findKnownGoodByHash, loadKnownGoodFingerprints } from './fingerprints';

export type UrlRiskCategory = 'green' | 'yellow' | 'red';

export interface UrlAuditSignals {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  hostname: string;
  statusCode?: number;
  contentType?: string;
  truncated: boolean;
  sha256?: string;
  sha256Normalized?: string;
  knownGood?: {
    id: string;
    label: string;
    hostname?: string;
    hostnameMismatch?: boolean;
  };
  dynamic?: any;
  matches: Array<{ id: string; label: string; count: number }>;
}

export interface UrlAuditResult {
  url: string;
  normalizedUrl: string;
  finalUrl?: string;
  hostname: string;
  statusCode?: number;
  contentType?: string;
  truncated: boolean;
  riskScore: number;
  riskCategory: UrlRiskCategory;
  reasons: string[];
  signals: UrlAuditSignals;
}

function normalizeUrl(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) throw new Error('url is required');
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1') return true;

  // IPv4 private blocks
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;

  // IPv6 local/link-local/ULA
  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
  if (lower.startsWith('fe80:')) return true; // link-local

  return false;
}

async function assertPublicHostname(hostname: string) {
  const host = (hostname || '').trim().toLowerCase();
  if (!host) throw new Error('invalid url hostname');

  if (host === 'localhost' || host.endsWith('.local')) {
    throw new Error('local hostnames are not allowed');
  }

  const ipType = net.isIP(host);
  if (ipType) {
    if (isPrivateIp(host)) throw new Error('private IP targets are not allowed');
    return;
  }

  // DNS resolution to mitigate SSRF to internal networks
  let records: Array<{ address: string }> = [];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new Error('failed to resolve hostname');
  }

  if (!records.length) throw new Error('hostname did not resolve');
  for (const rec of records) {
    if (isPrivateIp(rec.address)) {
      throw new Error('hostname resolves to a private IP (blocked)');
    }
  }
}

async function readTextWithLimit(res: Response, limitBytes: number): Promise<{ text: string; truncated: boolean }> {
  if (!res.body) {
    const text = await res.text();
    return { text: text.slice(0, limitBytes), truncated: text.length > limitBytes };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let bytesRead = 0;
  let truncated = false;
  let result = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    bytesRead += value.byteLength;
    if (bytesRead > limitBytes) {
      truncated = true;
      // keep only the portion up to limitBytes
      const allowed = value.slice(0, Math.max(0, limitBytes - (bytesRead - value.byteLength)));
      result += decoder.decode(allowed, { stream: true });
      break;
    }

    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return { text: result, truncated };
}

function countMatches(haystack: string, re: RegExp): number {
  const m = haystack.match(re);
  return m ? m.length : 0;
}

function normalizeHtmlForFingerprint(html: string): string {
  const input = (html || '').toString();
  // Keep this conservative: strip scripts/styles/comments, normalize whitespace, lowercase.
  return input
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export async function auditUrl(inputUrl: string): Promise<UrlAuditResult> {
  const normalized = normalizeUrl(inputUrl);
  const url = new URL(normalized);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('only http/https urls are supported');
  }

  await assertPublicHostname(url.hostname);

  const controller = AbortSignal.timeout(8000);
  const res = await fetch(url.toString(), {
    redirect: 'follow',
    signal: controller,
    headers: {
      'user-agent': 'Blockpage411-UrlAudit/1.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const finalUrl = res.url || url.toString();
  const contentType = res.headers.get('content-type') || undefined;

  const { text, truncated } = await readTextWithLimit(res, 1024 * 1024);
  const html = text || '';

  const sha256 = crypto.createHash('sha256').update(html).digest('hex');
  const normalizedHtml = normalizeHtmlForFingerprint(html);
  const sha256Normalized = crypto.createHash('sha256').update(normalizedHtml).digest('hex');

  const fps = await loadKnownGoodFingerprints();
  const knownGood = findKnownGoodByHash(fps, sha256Normalized);

  const matchDefs: Array<{ id: string; label: string; re: RegExp; weight: number; reason: string }> = [
    {
      id: 'wallet-provider',
      label: 'Wallet provider APIs',
      re: /\b(window\.)?ethereum\b|\beth_requestAccounts\b|\bwallet_requestPermissions\b/gi,
      weight: 25,
      reason: 'Page references wallet-provider APIs',
    },
    {
      id: 'tx-send',
      label: 'Transaction send calls',
      re: /\beth_sendTransaction\b|\bwallet_sendTransaction\b/gi,
      weight: 35,
      reason: 'Page references transaction send methods',
    },
    {
      id: 'signing',
      label: 'Signing methods',
      re: /\bpersonal_sign\b|\beth_sign\b|\beth_signTypedData\b/gi,
      weight: 25,
      reason: 'Page references wallet signing methods',
    },
    {
      id: 'approvals',
      label: 'Token approval patterns',
      re: /\bapprove\b\s*\(|\bsetApprovalForAll\b\s*\(|\bpermit\b\s*\(/gi,
      weight: 35,
      reason: 'Page references token approval/permit patterns',
    },
    {
      id: 'obfuscation',
      label: 'Obfuscation primitives',
      re: /\beval\s*\(|\batob\s*\(|\bfromCharCode\s*\(|\bFunction\s*\(/gi,
      weight: 20,
      reason: 'Page uses common obfuscation primitives',
    },
    {
      id: 'airdrop-claim',
      label: 'Airdrop/claim CTAs',
      re: /\bairdrop\b|\bclaim\b|\bconnect\s+wallet\b/gi,
      weight: 10,
      reason: 'Page contains airdrop/claim/connect-wallet language',
    },
  ];

  const matches: UrlAuditSignals['matches'] = [];
  let score = 0;
  const reasons: string[] = [];

  for (const def of matchDefs) {
    const count = countMatches(html, def.re);
    matches.push({ id: def.id, label: def.label, count });
    if (count > 0) {
      score += def.weight;
      reasons.push(def.reason);
    }
  }

  // URL-level heuristics
  const hostLower = url.hostname.toLowerCase();
  if (/\bclaim\b|\bairdrop\b|\bconnect\b/.test(url.pathname.toLowerCase() + url.search.toLowerCase())) {
    score += 8;
    reasons.push('URL contains common claim/airdrop/connect keywords');
  }
  if (hostLower.endsWith('.xyz')) {
    score += 6;
    reasons.push('Suspicious TLD: .xyz');
  }

  // Clone / fingerprint detection.
  let knownGoodSignal: UrlAuditSignals['knownGood'] | undefined;
  if (knownGood) {
    const knownHost = (knownGood.hostname || '').toLowerCase().trim();
    const mismatch = !!knownHost && knownHost !== hostLower;
    knownGoodSignal = {
      id: knownGood.id,
      label: knownGood.label,
      hostname: knownGood.hostname,
      hostnameMismatch: mismatch,
    };

    if (mismatch) {
      score += 45;
      reasons.push(`Page content matches known-good fingerprint (${knownGood.label}) but hostname differs (possible clone)`);
    } else if (knownHost) {
      // If the content matches a known-good fingerprint on the expected host, reduce risk slightly.
      score = Math.max(0, score - 15);
    }
  }

  // Optional dynamic sandboxing (gated by env and skipped on Vercel).
  const dynamic = await runDynamicSandbox(res.url || url.toString());
  if (dynamic && dynamic.enabled) {
    const methods = new Set((dynamic.walletRequests || []).map((w: any) => String(w?.method || '').trim()).filter(Boolean));
    if (methods.size > 0) {
      score += 10;
      reasons.push('Dynamic analysis: page attempted wallet provider calls');
    }
    if (methods.has('eth_sendTransaction') || methods.has('wallet_sendTransaction')) {
      score += 35;
      reasons.push('Dynamic analysis: attempted transaction send');
    }
    if (methods.has('personal_sign') || methods.has('eth_sign') || methods.has('eth_signTypedData') || methods.has('eth_signTypedData_v4')) {
      score += 25;
      reasons.push('Dynamic analysis: attempted signing');
    }
    if (methods.has('wallet_requestPermissions') || methods.has('eth_requestAccounts')) {
      score += 15;
      reasons.push('Dynamic analysis: attempted account connection');
    }
    if (Array.isArray(dynamic.clicked) && dynamic.clicked.length > 0) {
      score += 6;
      reasons.push('Dynamic analysis: clicked CTA-like elements');
    }
  }

  if (res.status >= 400) {
    score = Math.max(score - 10, 0);
  }

  if (score > 100) score = 100;

  let category: UrlRiskCategory = 'green';
  if (score > 60) category = 'red';
  else if (score > 25) category = 'yellow';

  // de-dupe reasons
  const uniqueReasons = Array.from(new Set(reasons));

  const signals: UrlAuditSignals = {
    inputUrl,
    normalizedUrl: url.toString(),
    finalUrl,
    hostname: url.hostname,
    statusCode: res.status,
    contentType,
    truncated,
    sha256,
    sha256Normalized,
    knownGood: knownGoodSignal,
    dynamic,
    matches,
  };

  return {
    url: inputUrl,
    normalizedUrl: url.toString(),
    finalUrl,
    hostname: url.hostname,
    statusCode: res.status,
    contentType,
    truncated,
    riskScore: score,
    riskCategory: category,
    reasons: uniqueReasons,
    signals,
  };
}
