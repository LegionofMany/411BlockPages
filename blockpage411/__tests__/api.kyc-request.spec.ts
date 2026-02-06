import type { NextApiRequest, NextApiResponse } from 'next';

function makeReq(opts: Partial<NextApiRequest>): NextApiRequest {
  return opts as NextApiRequest;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (obj: any) => { res._json = obj; return res; };
  res.setHeader = () => res;
  return res as NextApiResponse;
}

describe('/api/kyc-request', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('returns 405 when method not allowed', async () => {
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/kyc-request')).default;
      const req: any = makeReq({ method: 'GET', cookies: {} });
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(405);
    });
  });

  it('returns 410 gone (retired endpoint)', async () => {
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/kyc-request')).default;
      const req: any = makeReq({ method: 'POST', cookies: {} });
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(410);
      expect((res as any)._json?.success).toBe(false);
      expect(String((res as any)._json?.message || '')).toMatch(/retired/i);
    });
  });
});
