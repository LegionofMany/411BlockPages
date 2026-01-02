// Tests for /api/profile/update
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

describe('/api/profile/update', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects when walletAddress missing', async () => {
    const mockVerify = jest.fn().mockReturnValue({ address: '0xabc' });
    jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: mockVerify } }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
    jest.doMock('lib/walletModel', () => ({ __esModule: true, default: { updateMany: jest.fn() } }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/profile/update')).default;
      const req = makeReq({ method: 'PUT', cookies: { token: 'tok' } as any, body: {} });
      const res = makeRes();
      await handler(req, res);
      expect((res as any)._status).toBe(400);
      expect((res as any)._json).toMatchObject({ message: 'Invalid request' });
    });
  });

  it('updates existing user profile', async () => {
    const mockVerify = jest.fn().mockReturnValue({ address: '0xabc' });
    const mockUser: any = {
      _id: 'user1',
      address: '0xabc',
      profileUpdateHistory: [],
    };
    const updatedUser = { ...mockUser, displayName: 'NewName' };

    jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: mockVerify } }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({ __esModule: true, default: { findOne: jest.fn().mockResolvedValue(mockUser), findOneAndUpdate: jest.fn().mockResolvedValue(updatedUser), create: jest.fn() } }));
    jest.doMock('lib/walletModel', () => ({ __esModule: true, default: { updateMany: jest.fn().mockResolvedValue({}) } }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/profile/update')).default;
      const req = makeReq({ method: 'PUT', cookies: { token: 'tok' } as any, body: { walletAddress: '0xabc', displayName: 'NewName' } });
      const res = makeRes();
      await handler(req, res);
      expect((res as any)._status).toBe(200);
      expect((res as any)._json).toMatchObject({ success: true });
      expect((res as any)._json.profile.displayName).toBe('NewName');
    });
  });
});
