import mongoose, { Mongoose } from 'mongoose';
import path from 'path';
import fs from 'fs';

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

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseCache = (global as typeof globalThis & { mongoose: MongooseCache }).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & { mongoose: MongooseCache }).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    // Wrap connect in try/catch so we can log helpful guidance for Atlas failures
    cached.promise = (async () => {
      try {
        const m = await mongoose.connect(MONGODB_URI!, {
          bufferCommands: false,
        });
        return m;
      } catch (err) {
        // Mask credentials when printing the URI
        try {
          const masked = String(MONGODB_URI).replace(/:[^:@]+@/, ':*****@');
          console.error('Failed to connect to MongoDB at', masked);
        } catch (_) {
          console.error('Failed to connect to MongoDB (unable to mask URI)');
        }
        console.error('Mongoose connect error (full):', err);
        console.error('Common causes: incorrect credentials, network/VPC restrictions, or missing Atlas IP allowlist. See https://www.mongodb.com/docs/atlas/security-whitelist/');
        throw err;
      }
    })();
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
