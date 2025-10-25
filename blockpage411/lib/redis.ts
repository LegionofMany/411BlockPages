import Redis from 'ioredis';

// Allow temporarily disabling Redis in development by setting REDIS_URL=DISABLE_REDIS
const redisUrl = process.env.REDIS_URL;

export type RedisLike = {
  get: (...args: unknown[]) => Promise<unknown> | unknown;
  set: (...args: unknown[]) => Promise<unknown> | unknown;
  del: (...args: unknown[]) => Promise<unknown> | unknown;
  publish: (...args: unknown[]) => Promise<number> | number;
	zrevrange?: (...args: unknown[]) => Promise<string[]> | string[];
  subscribe: (...args: unknown[]) => Promise<unknown> | unknown;
  quit: (...args: unknown[]) => Promise<unknown> | unknown;
  on: (ev: string, cb: (...a: unknown[]) => void) => void;
};

// The client may be an actual ioredis Redis instance or our lightweight RedisLike stub
let client: Redis | RedisLike;
if (!redisUrl || redisUrl === 'DISABLE_REDIS') {
	const noop = async () => null;
	client = {
		get: noop,
		set: noop,
		del: noop,
		publish: async () => 0,
		zrevrange: async () => [],
		subscribe: noop,
		quit: noop,
		on: () => {},
	};
} else {
	client = new Redis(redisUrl);
			client.on('error', (err) => {
				console.warn('[ioredis] connection error:', err && (err as Error).message ? (err as Error).message : err);
			});
}

export default client;
