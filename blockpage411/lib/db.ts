import mongoose, { Mongoose } from 'mongoose';
import path from 'path';
import fs from 'fs';

const isMongoDisabled =
  process.env.MONGODB_DISABLED === '1' ||
  process.env.DISABLE_MONGODB === '1' ||
  process.env.MONGODB_DISABLED === 'true' ||
  process.env.DISABLE_MONGODB === 'true';

const isMongoFailFast =
  process.env.MONGODB_FAIL_FAST === '1' ||
  process.env.MONGODB_FAIL_FAST === 'true' ||
  process.env.FAIL_FAST_MONGODB === '1' ||
  process.env.FAIL_FAST_MONGODB === 'true';

function makeDbError(message: string, code: string) {
  const err = new Error(message) as Error & { code?: string };
  err.code = code;
  return err;
}

function getEnvInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function shouldLogMongoError() {
  const g = global as typeof globalThis & { __mongoLastLogAt?: number };
  const now = Date.now();
  const last = g.__mongoLastLogAt || 0;
  // Throttle repetitive logs (e.g., per request) to once per 30s.
  if (now - last < 30_000) return false;
  g.__mongoLastLogAt = now;
  return true;
}

let MONGODB_URI = process.env.MONGODB_URI as string | undefined;

// If MONGODB_URI is not set at import time, attempt to load .env.local (helpful during tests)
if (!MONGODB_URI) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      // Load environment from .env.local so tests and scripts pick it up when run from project root
  // Use require to avoid adding dotenv to compile-time imports for environments that don't need it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: envPath });
      MONGODB_URI = process.env.MONGODB_URI as string | undefined;
    }
  } catch {
    // ignore - we'll throw below if still missing
  }
}

// Do not throw at import-time: Next.js may import server modules during build
// to collect route configuration. We throw at call-time in dbConnect() instead.

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseCache = (global as typeof globalThis & { mongoose: MongooseCache }).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & { mongoose: MongooseCache }).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (isMongoDisabled) {
    throw makeDbError('MongoDB disabled via env (set MONGODB_DISABLED=0 to enable).', 'MONGODB_DISABLED');
  }
  if (!MONGODB_URI) {
    throw makeDbError('Please define the MONGODB_URI environment variable inside .env.local', 'MONGODB_URI_MISSING');
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    // Defaults are intentionally more generous than before: Atlas discovery can take
    // >6s on some networks even when connectivity is correct.
    // If you want the previous behavior, set MONGODB_FAIL_FAST=1.
    const serverSelectionTimeoutMS = getEnvInt(
      'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
      isMongoFailFast ? 6_000 : 20_000
    );
    const connectTimeoutMS = getEnvInt('MONGODB_CONNECT_TIMEOUT_MS', isMongoFailFast ? 6_000 : 20_000);
    const socketTimeoutMS = getEnvInt('MONGODB_SOCKET_TIMEOUT_MS', isMongoFailFast ? 20_000 : 30_000);

    // Wrap connect in try/catch so we can log helpful guidance for Atlas failures
    cached.promise = (async () => {
      try {
        const m = await mongoose.connect(MONGODB_URI!, {
          bufferCommands: false,
          // Fail fast so API routes don't hang for minutes when DNS/SRV is blocked
          // or when Atlas is unreachable from the current network.
          serverSelectionTimeoutMS,
          connectTimeoutMS,
          socketTimeoutMS,
        } as any);
        return m;
      } catch (err) {
        if (shouldLogMongoError()) {
          // Mask credentials when printing the URI
          try {
            const masked = String(MONGODB_URI).replace(/:[^:@]+@/, ':*****@');
            console.error('Failed to connect to MongoDB at', masked);
          } catch (_) {
            console.error('Failed to connect to MongoDB (unable to mask URI)');
          }
          console.error('Mongoose connect error (full):', err);
          // Extra guidance for the specific failure you're seeing: querySrv ECONNREFUSED
          // which commonly happens when the environment blocks SRV DNS lookups used by
          // mongodb+srv:// URIs.
          const e = err as any;
          if (e?.syscall === 'querySrv' || String(e?.message || '').includes('querySrv')) {
            console.error(
              'Tip: Your environment appears to be blocking SRV DNS (mongodb+srv). ' +
                'Try using a non-SRV connection string (mongodb://host1,host2,...), or fix DNS/network egress.'
            );
          }
          console.error(
            'Common causes: incorrect credentials, network/VPC restrictions, blocked DNS/SRV, or missing Atlas IP allowlist. ' +
              'See https://www.mongodb.com/docs/atlas/security-whitelist/'
          );
        }

        // Allow retries on subsequent requests (important in dev when connectivity changes).
        cached.promise = null;
        const wrapped = makeDbError('Failed to connect to MongoDB.', 'MONGODB_CONNECT_FAILED') as Error & {
          cause?: unknown;
        };
        wrapped.cause = err;
        throw wrapped;
      }
    })();
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
