/**
 * Minimal test harness for local dev. Intended to be run with ts-node.
 * Tests are lightweight and mostly smoke-tests due to network calls.
 */
import 'dotenv/config';
import { detectEvmDonation } from '../services/evm';

async function run() {
  console.log('EVM detect smoke test (no network if no RPC set)');
  try {
    const r = await detectEvmDonation({ txHash: '0xdeadbeef', targetAddress: '0x0000000000000000000000000000000000000000', chain: 'ethereum' });
    console.log('detectEvmDonation result:', r);
  } catch (err) {
    console.error('smoke test error', err);
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
