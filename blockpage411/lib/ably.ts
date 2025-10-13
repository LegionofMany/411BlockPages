/* lib/ably.ts
   Small helper wrapper to publish to Ably and create token requests
*/
const ABLY_API_KEY = process.env.ABLY_API_KEY;

export async function publishToAbly(channel: string, event: string, data: unknown) {
  if (!ABLY_API_KEY) throw new Error('Missing ABLY_API_KEY');
  const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
  const body = [{ name: event, data }];
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(ABLY_API_KEY).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Ably publish failed: ${resp.status} ${txt}`);
  }
  return true;
}

export async function createAblyTokenRequest(ttlSeconds = 3600, clientId?: string) {
  if (!ABLY_API_KEY) throw new Error('Missing ABLY_API_KEY');
  // Dynamically import Ably server SDK to avoid bundling into client bundles
  try {
    const AblyModule = await import('ably');
    type RestType = {
      auth: {
        createTokenRequest: (opts: { ttl?: number; clientId?: string }, cb: (err: Error | null, tokenRequest?: unknown) => void) => void;
      };
    };
    const RestConstructor = (AblyModule as unknown as { Rest: unknown }).Rest as new (opts: { key: string }) => RestType;
    const rest = new RestConstructor({ key: ABLY_API_KEY });

    return await new Promise<unknown>((resolve, reject) => {
      const opts: { ttl?: number; clientId?: string } = { ttl: ttlSeconds * 1000 };
      if (clientId) opts.clientId = clientId;
      try {
        // createTokenRequest takes (opts, callback) in the installed Ably SDK.
        rest.auth.createTokenRequest(opts, (err, tokenRequest) => {
          if (err) return reject(err);
          resolve(tokenRequest);
        });
      } catch (innerErr) {
        return reject(innerErr);
      }
    });
  } catch (err) {
    // provide additional context and rethrow so callers can handle/log
    const msg = (err as Error)?.message || String(err);
    throw new Error(`Ably token creation failed: ${msg}`);
  }
}
