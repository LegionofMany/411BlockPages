import Redis from 'ioredis';

const url = process.env.REDIS_URL;
let client: Redis | null = null;
if (url) client = new Redis(url);

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
