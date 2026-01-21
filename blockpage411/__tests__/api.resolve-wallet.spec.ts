/// <reference types="jest" />

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ResolvedWalletInput } from 'services/resolveWalletInput';

type ResolveWalletInputFn = (query: string) => Promise<ResolvedWalletInput | null>;

// Mock minimal req/res
function makeReq(opts: any) {
  return opts as any;
}
function makeRes() {
  const res: any = {};
  res.setHeader = (k: string, v: string) => {
    res._headers = res._headers || {};
    res._headers[k.toLowerCase()] = v;
    return res;
  };
  res.status = (code: number) => {
    res._status = code;
    return res;
  };
  res.json = (obj: any) => {
    res._json = obj;
    return res;
  };
  return res;
}

describe('/api/resolve-wallet', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 when q is missing', async () => {
    jest.doMock('services/resolveWalletInput', () => ({ __esModule: true, resolveWalletInput: jest.fn() }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/resolve-wallet')).default;
      const req = makeReq({ method: 'GET', query: {} });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(400);
      expect(res._json).toEqual({ message: 'Missing q' });
    });
  });

  it('returns 200 with resolved data', async () => {
    const resolveWalletInput = jest.fn<ResolveWalletInputFn>();
    resolveWalletInput.mockResolvedValue({
      address: '0x0000000000000000000000000000000000000000',
      resolvedFrom: 'ens',
      chainHint: 'ethereum',
    });
    jest.doMock('services/resolveWalletInput', () => ({ __esModule: true, resolveWalletInput }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/resolve-wallet')).default;
      const req = makeReq({ method: 'GET', query: { q: 'vitalik.eth' } });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._json).toMatchObject({
        address: '0x0000000000000000000000000000000000000000',
        resolvedFrom: 'ens',
      });
      expect(resolveWalletInput).toHaveBeenCalledWith('vitalik.eth');
    });
  });

  it('returns 500 on resolver error', async () => {
    const resolveWalletInput = jest.fn<ResolveWalletInputFn>();
    resolveWalletInput.mockRejectedValue(new Error('boom'));
    jest.doMock('services/resolveWalletInput', () => ({ __esModule: true, resolveWalletInput }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/resolve-wallet')).default;
      const req = makeReq({ method: 'GET', query: { q: 'whatever' } });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(500);
      expect(res._json).toEqual({ message: 'boom' });
    });
  });
});
