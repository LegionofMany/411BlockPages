// Tests for /api/me.patch profile + presets
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

describe('/api/me.patch', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects when user is not found', async () => {
    const mockVerify = jest.fn().mockReturnValue({ address: '0xabc' });
    jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: mockVerify } }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({ __esModule: true, default: { findOne: jest.fn().mockResolvedValue(null) } }));
    jest.doMock('models/Charity', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
    jest.doMock('models/Event', () => ({ __esModule: true, default: { findById: jest.fn() } }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/me.patch')).default;
      const req = makeReq({
        method: 'PATCH',
        cookies: { token: 'tok' } as any,
        body: {},
      });
      const res = makeRes();
      await handler(req, res);
      expect((res as any)._status).toBe(404);
      expect((res as any)._json).toMatchObject({ message: 'User not found' });
    });
  });

  it('updates featuredCharityId when valid', async () => {
    const mockVerify = jest.fn().mockReturnValue({ address: '0xabc' });
    const mockUser: any = {
      _id: 'user1',
      address: '0xabc',
      profileUpdateHistory: [],
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: mockVerify } }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({ __esModule: true, default: { findOne: jest.fn().mockResolvedValue(mockUser) } }));
    jest.doMock('models/Charity', () => ({
      __esModule: true,
      default: {
        findOne: jest.fn(() => ({
          lean: jest.fn().mockResolvedValue({ charityId: '123' }),
        })),
      },
    }));
    jest.doMock('models/Event', () => ({ __esModule: true, default: { findById: jest.fn() } }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/me.patch')).default;
      const req = makeReq({
        method: 'PATCH',
        cookies: { token: 'tok' } as any,
        body: { featuredCharityId: '123' },
      });
      const res = makeRes();
      await handler(req, res);
      expect(mockUser.featuredCharityId).toBe('123');
      expect((res as any)._status).toBe(200);
      expect((res as any)._json).toMatchObject({ success: true });
    });
  });
});
