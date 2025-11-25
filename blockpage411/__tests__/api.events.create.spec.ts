// Tests for /api/events/create
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

describe('/api/events/create', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects invalid payload via zod', async () => {
    const mockVerify = jest.fn().mockReturnValue({ address: '0xabc' });
    jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: mockVerify } }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({
      __esModule: true,
      default: {
        findOne: jest.fn(() => ({
          lean: jest.fn().mockResolvedValue({ _id: 'u1', address: '0xabc' }),
        })),
      },
    }));
    jest.doMock('models/Event', () => ({ __esModule: true, default: { create: jest.fn() } }));
    jest.doMock('lib/redisRateLimit', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(true) }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/events/create')).default;
      const req = makeReq({
        method: 'POST',
        headers: { authorization: 'Bearer tok' } as any,
        body: { title: '', description: '', goalAmount: -1 },
      });
      const res = makeRes();
      await handler(req, res);
      expect((res as any)._status).toBe(400);
      expect((res as any)._json).toHaveProperty('error', 'Invalid payload');
    });
  });

  it('creates event for valid payload', async () => {
    const mockVerify = jest.fn().mockReturnValue({ address: '0xabc' });
    const mockCreate = jest.fn().mockResolvedValue({ _id: 'e1' });
    jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: mockVerify } }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({
      __esModule: true,
      default: {
        findOne: jest.fn(() => ({
          lean: jest.fn().mockResolvedValue({ _id: 'u1', address: '0xabc' }),
        })),
      },
    }));
    jest.doMock('models/Event', () => ({ __esModule: true, default: { create: mockCreate } }));
    jest.doMock('lib/redisRateLimit', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(true) }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/events/create')).default;
      const now = new Date();
      const deadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const req = makeReq({
        method: 'POST',
        headers: { authorization: 'Bearer tok' } as any,
        body: {
          title: 'Test Event',
          description: 'Desc',
          goalAmount: 100,
          deadline,
          recipientWallet: '0x0000000000000000000000000000000000000001',
        },
      });
      const res = makeRes();
      await handler(req, res);
      expect((res as any)._status).toBe(201);
      expect(mockCreate).toHaveBeenCalled();
      expect((res as any)._json).toHaveProperty('event');
    });
  });
});
