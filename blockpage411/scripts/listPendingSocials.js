#!/usr/bin/env node
/* Quick script: connect with mongoose and list users with pendingSocialVerifications */
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(2);
  }
  await mongoose.connect(uri, { bufferCommands: false });
  try {
    const users = await mongoose.connection.collection('users').find({ pendingSocialVerifications: { $exists: true, $ne: [] } }).toArray();
    const out = users.map(u => ({ address: u.address, pendingSocialVerifications: u.pendingSocialVerifications }));
    console.log(JSON.stringify(out, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB', err);
    await mongoose.disconnect();
    process.exit(2);
  }
}

run();
