// Tests for /api/webhooks/givingblock signature verification
import type { NextApiRequest, NextApiResponse } from 'next';

function makeReq(opts: Partial<NextApiRequest>): NextApiRequest {
  // we only use headers and method/body (raw body is read via events but we can mock helper)
  return opts as NextApiRequest;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (obj: any) => { res._json = obj; return res; };
  res.setHeader = () => res;
  return res as NextApiResponse;
}

describe('/api/webhooks/givingblock', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('rejects invalid signature', async () => {
    jest.doMock('services/givingBlockService', () => ({
      __esModule: true,
      verifyWebhookSignature: jest.fn(() => false),
      decryptPayload: jest.fn(),
      normalizeCharity: jest.fn(),
    }));

    // mock db + Charity to avoid real calls
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('models/Charity', () => ({ __esModule: true, default: { updateOne: jest.fn() } }));

    // mock readBody by stubbing req.on usage via manual promise resolution
    const req: any = makeReq({ method: 'POST', headers: { 'x-givingblock-signature': 'bad' } as any });
    const chunks: any[] = [];
    req.on = (event: string, cb: (arg?: any) => void) => {
      if (event === 'data') {
        // no data
      } else if (event === 'end') {
        cb(Buffer.from('"{}"'));
      }
    };

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/webhooks/givingblock')).default;
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(400);
      expect((res as any)._json).toMatchObject({ error: 'Invalid signature' });
    });
  });
});
