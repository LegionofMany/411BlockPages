import http from 'http';
import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';
import { randomUUID } from 'crypto';
import { runDynamicSandbox } from '../services/urlAudit/dynamicSandbox';

function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(aHex, 'hex'), Buffer.from(bHex, 'hex'));
  } catch {
    return false;
  }
}

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;

  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('fe80:')) return true;

  return false;
}

async function assertPublicHostname(hostname: string) {
  const host = (hostname || '').trim().toLowerCase();
  if (!host) throw new Error('invalid url hostname');
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('local hostnames are not allowed');

  const ipType = net.isIP(host);
  if (ipType) {
    if (isPrivateIp(host)) throw new Error('private IP targets are not allowed');
    return;
  }

  const records = await dns.lookup(host, { all: true });
  if (!records.length) throw new Error('hostname did not resolve');
  for (const rec of records) {
    if (isPrivateIp(rec.address)) throw new Error('hostname resolves to a private IP (blocked)');
  }
}

async function readRaw(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res: http.ServerResponse, status: number, obj: any) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

type EnqueueBody = {
  version?: number;
  auditId: string;
  url: string;
  callbackUrl: string;
  requestedAt?: string;
};

async function postCallback(callbackUrl: string, secret: string, payloadObj: any) {
  const payload = JSON.stringify(payloadObj);
  const signature = hmacSha256Hex(secret, payload);

  await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-bp411-signature': signature,
    },
    body: payload,
    signal: AbortSignal.timeout(12_000),
  });
}

async function handleJob(jobId: string, body: EnqueueBody, secret: string) {
  const completedAt = new Date().toISOString();

  let dynamic: any;
  try {
    const target = new URL(body.url);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') throw new Error('only http/https supported');
    await assertPublicHostname(target.hostname);

    // Ensure sandbox is enabled in this worker runtime.
    process.env.ENABLE_URL_AUDIT_DYNAMIC = 'true';

    dynamic = await runDynamicSandbox(body.url);
  } catch (err) {
    dynamic = {
      enabled: false,
      skippedReason: 'worker_error',
      error: (err as Error)?.message || 'worker_error',
      walletRequests: [],
      consoleMessages: [],
      network: [],
      clicked: [],
    };
  }

  try {
    await postCallback(body.callbackUrl, secret, {
      auditId: body.auditId,
      jobId,
      dynamic,
      completedAt,
    });
  } catch {
    // best-effort
  }
}

const secret = (process.env.DYNAMIC_WORKER_SECRET || '').trim();
if (!secret) {
  // eslint-disable-next-line no-console
  console.error('Missing DYNAMIC_WORKER_SECRET');
  process.exit(1);
}

const port = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 404, { message: 'Not found' });

  if (req.method === 'GET' && (req.url === '/' || req.url === '/healthz')) {
    return sendJson(res, 200, { ok: true, service: 'bp411-dynamic-worker' });
  }

  if (req.method === 'POST' && req.url === '/url-audit/dynamic') {
    const signature = String(req.headers['x-bp411-signature'] || '').trim();
    const raw = await readRaw(req);

    const expected = hmacSha256Hex(secret, raw);
    if (!signature || !timingSafeEqualHex(expected, signature)) {
      return sendJson(res, 401, { message: 'Invalid signature' });
    }

    let body: EnqueueBody;
    try {
      body = JSON.parse(raw);
    } catch {
      return sendJson(res, 400, { message: 'Invalid JSON' });
    }

    if (!body?.auditId || typeof body.auditId !== 'string') return sendJson(res, 400, { message: 'auditId required' });
    if (!body?.url || typeof body.url !== 'string') return sendJson(res, 400, { message: 'url required' });
    if (!body?.callbackUrl || typeof body.callbackUrl !== 'string') return sendJson(res, 400, { message: 'callbackUrl required' });

    const jobId = randomUUID();

    // Respond quickly; do the scan async.
    sendJson(res, 202, { ok: true, jobId });

    setImmediate(() => {
      void handleJob(jobId, body, secret);
    });

    return;
  }

  sendJson(res, 404, { message: 'Not found' });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Dynamic URL audit worker listening on :${port}`);
});
