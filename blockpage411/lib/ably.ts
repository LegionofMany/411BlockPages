/* lib/ably.ts
   Small helper wrapper to publish to Ably and create token requests
*/
let ABLY_UNAVAILABLE = false;
let ABLY_LAST_ERROR: string | undefined;

function isValidAblyKey(key?: string) {
  if (!key) return false;
  // Ably keys are typically in the form "<id>.<env>:<secret>" or "<key>:<secret>"; require a colon as a simple check
  return key.includes(':');
}

export async function publishToAbly(channel: string, event: string, data: unknown) {
  const key = process.env.ABLY_API_KEY;
  if (!isValidAblyKey(key)) {
    // Mark unavailable and short-circuit rather than throwing so callers can remain stable
    ABLY_UNAVAILABLE = true;
    ABLY_LAST_ERROR = 'Missing or invalid ABLY_API_KEY';
    console.warn('[lib/ably] Ably not configured, publish skipped');
    return false;
  }
  const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
  const body = [{ name: event, data }];
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(key as string).toString('base64'),
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
  const key = process.env.ABLY_API_KEY;
  if (!isValidAblyKey(key)) {
    // Don't throw here; set an unavailable flag and return null so callers can handle gracefully.
    ABLY_UNAVAILABLE = true;
    ABLY_LAST_ERROR = 'Missing or invalid ABLY_API_KEY';
    console.warn('[lib/ably] Ably not configured, createAblyTokenRequest returning null');
    return null;
  }
  if (ABLY_UNAVAILABLE) {
    // Fast-fail path when we've seen repeated failures
    throw new Error(`Ably unavailable: ${ABLY_LAST_ERROR || 'previous initialization failed'}`);
  }

  // Dynamically import Ably server SDK to avoid bundling into client bundles
  try {
    const AblyModule = await import('ably');
    type RestType = {
      auth: {
        createTokenRequest: (opts: { ttl?: number; clientId?: string }, cb: (err: Error | null, tokenRequest?: unknown) => void) => void;
      };
    };
    const RestConstructor = (AblyModule as unknown as { Rest: unknown }).Rest as new (opts: { key: string }) => RestType;

    // construct the Ably Rest client with the provided key
    const rest = new RestConstructor({ key: key as string });

    return await new Promise<unknown>((resolve, reject) => {
      const opts: { ttl?: number; clientId?: string } = { ttl: ttlSeconds * 1000 };
      if (clientId) opts.clientId = clientId;
      // guard synchronous exceptions coming from the SDK call
      try {
        rest.auth.createTokenRequest(opts, (err, tokenRequest) => {
          if (err) {
            // mark as unavailable for a short time to avoid loud repeated errors
            ABLY_UNAVAILABLE = true;
            ABLY_LAST_ERROR = (err as Error)?.message || String(err);
            return reject(err);
          }
          resolve(tokenRequest);
        });
      } catch (syncErr) {
        ABLY_UNAVAILABLE = true;
        ABLY_LAST_ERROR = (syncErr as Error)?.message || String(syncErr);
        return reject(syncErr);
      }
    });
  } catch (err) {
    // provide additional context and rethrow so callers can handle/log
    const msg = (err as Error)?.message || String(err);
    throw new Error(`Ably token creation failed: ${msg}`);
  }
}
