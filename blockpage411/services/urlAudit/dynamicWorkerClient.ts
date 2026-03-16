import crypto from 'crypto';

export interface DynamicWorkerEnqueueResponse {
  ok: boolean;
  jobId?: string;
  error?: string;
}

function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function signDynamicWorkerPayload(secret: string, body: unknown): { payload: string; signature: string } {
  const payload = JSON.stringify(body);
  return { payload, signature: hmacSha256Hex(secret, payload) };
}

export function verifyDynamicWorkerSignature(secret: string, payload: string, signature: string): boolean {
  if (!secret || !payload || !signature) return false;
  const expected = hmacSha256Hex(secret, payload);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export async function enqueueDynamicWorkerScan(params: {
  workerUrl: string;
  workerSecret: string;
  auditId: string;
  url: string;
  callbackUrl: string;
  requestedAt: string;
  timeoutMs?: number;
}): Promise<DynamicWorkerEnqueueResponse> {
  const { workerUrl, workerSecret, auditId, url, callbackUrl, requestedAt } = params;
  const timeoutMs = Math.max(500, Math.min(10_000, params.timeoutMs ?? 2500));

  if (!workerUrl) return { ok: false, error: 'worker_url_missing' };
  if (!workerSecret) return { ok: false, error: 'worker_secret_missing' };

  const body = {
    auditId,
    url,
    callbackUrl,
    requestedAt,
    // simple protocol version for forward-compat
    version: 1,
  };

  const { payload, signature } = signDynamicWorkerPayload(workerSecret, body);

  const res = await fetch(workerUrl.replace(/\/$/, '') + '/url-audit/dynamic', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-bp411-signature': signature,
    },
    body: payload,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: text || `worker_http_${res.status}` };
  }

  const json = (await res.json().catch(() => null)) as any;
  if (json && json.jobId) return { ok: true, jobId: String(json.jobId) };
  return { ok: true };
}
