import Redis from 'ioredis';

const url = process.env.REDIS_URL;
let client: Redis | null = null;

// Respect DISABLE_REDIS flag used elsewhere in the app
if (url && url !== 'DISABLE_REDIS') {
  client = new Redis(url);
  client.on('error', (err) => {
    // Avoid throwing on connection issues; just log and keep going
    // so callers can gracefully fall back when Redis is unavailable.
    // eslint-disable-next-line no-console
    console.warn(
      '[ioredis] connection error (redisCache):',
      err instanceof Error ? err.message : err,
    );
  });
}

export async function getCache(key: string): Promise<unknown | null> {
  if (client) {
    try {
      const v = await client.get(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function setCache(key: string, value: unknown, ttl = 3600) {
  if (client) {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
      // ignore
    }
  }
}

export function getRedisClient() {
  return client;
}
