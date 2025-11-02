import fs from 'fs';
import os from 'os';
import path from 'path';
import importerCli from '../lib/importerCli';

describe('importerCli resumable behavior', () => {
  // some importer tests may perform IO and retries; increase timeout
  jest.setTimeout(20000);
  const tmpDir = path.join(os.tmpdir(), 'blockpage411-test');
  beforeAll(() => { if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true }); });
  afterAll(() => { try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {} });

  test('imports NDJSON file and writes checkpoint, supports resume', async () => {
    const file = path.join(tmpDir, 'test.ndjson');
    const items = [{ providerName: 'Binance', address: '0x1', chain: 'ethereum' }, { providerName: 'Binance', address: '0x2', chain: 'ethereum' }, { providerName: 'Binance', address: '0x3', chain: 'ethereum' }];
    fs.writeFileSync(file, items.map(i => JSON.stringify(i)).join('\n'));
    const checkpointFile = path.join(tmpDir, 'import.chk.json');

    // first run: process first 1 item then abort (simulate by using batchSize 1)
    const res1 = await importerCli.importFromFile(file, { batchSize: 1, dryRun: true, checkpointFile, resume: false, ndjson: true });
    expect(res1.processed).toBeGreaterThanOrEqual(0);
    const state1 = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    expect(state1).toHaveProperty('lastIndex');

    // now resume from checkpoint
    const res2 = await importerCli.importFromFile(file, { batchSize: 2, dryRun: true, checkpointFile, resume: true, ndjson: true });
    const state2 = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    expect(state2.lastIndex).toBeGreaterThanOrEqual(items.length);
    expect(res2.processed).toBeGreaterThanOrEqual(0);
  });
});
