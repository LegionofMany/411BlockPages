import mongoose from 'mongoose';
import dotenv from 'dotenv';

// prefer a custom dotenv path via DOTENV_CONFIG_PATH, otherwise load .env.local by default
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  try {
  console.log('Ensuring unique index on Pledge (fundraiserId, externalId)');
  // Avoid importing the Mongoose model to prevent ESM resolution issues under ts-node
  // Directly create the index on the underlying collection name used by the Pledge model: 'pledges'
  const db = mongoose.connection.db;
  if (!db) throw new Error('mongoose.connection.db is undefined — connection failed');
  const collection = db.collection('pledges');
  await collection.createIndex({ fundraiserId: 1, externalId: 1 }, { unique: true, background: true });
    console.log('Index ensured');
  } catch (err) {
    console.error('Index creation failed', err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
