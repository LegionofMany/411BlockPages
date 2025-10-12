import { withProvider } from '../services/provider';

jest.setTimeout(10000);

describe('withProvider backoff', () => {
  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0;
    const res = await withProvider(undefined, async () => {
      attempts++;
      if (attempts < 2) throw new Error('temp');
      return 'ok';
    }, { timeoutMs: 2000, retries: 2 } as any);
    expect(res).toBe('ok');
  });

  it('opens circuit after repeated failures', async () => {
    // Force failures
    try {
      await withProvider(undefined, async () => { throw new Error('fail'); }, { timeoutMs: 500, retries: 0 } as any);
    } catch (e) {
      expect(e).toBeTruthy();
    }
    // Next call should hit circuit open quickly
    await expect(withProvider(undefined, async () => 'ok', { timeoutMs: 500, retries: 0 } as any)).rejects.toThrow(/circuit/);
  });
});
