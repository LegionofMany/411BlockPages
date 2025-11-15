#!/usr/bin/env ts-node
import { fetchGivingBlockCharities } from '../utils/givingblock';

async function main() {
  try {
    console.log('Refreshing Giving Block cache...');
    const list = await fetchGivingBlockCharities();
    console.log(`Fetched ${Array.isArray(list) ? list.length : 0} items`);
    process.exit(0);
  } catch (e) {
    console.error('Refresh failed', e);
    process.exit(1);
  }
}

if (require.main === module) main();
