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

  it('returns 401 when no token', async () => {
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/kyc-request')).default;
      const req: any = makeReq({ method: 'POST', cookies: {} });
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(401);
    });
  });

  it('returns 404 when user not found', async () => {
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/userModel', () => ({ __esModule: true, default: { findOne: jest.fn(() => null) } }));
    // create a valid JWT token by mocking jsonwebtoken for the isolated module
    jest.doMock('jsonwebtoken', () => ({ __esModule: true, verify: () => ({ address: '0xnope' }) }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/kyc-request')).default;
      const req: any = makeReq({ method: 'POST', cookies: { token: 'dummy' } });
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(404);
    });
    jest.dontMock('jsonwebtoken');
  });

  it('creates pending state and notifies admins', async () => {
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    const fakeUser: any = { address: '0xabc', kycStatus: 'unknown', baseVerifiedAt: new Date(), save: jest.fn(() => Promise.resolve()) };
    jest.doMock('lib/userModel', () => ({ __esModule: true, default: { findOne: jest.fn(() => fakeUser) } }));
    jest.doMock('lib/auditLogModel', () => ({ __esModule: true, default: { create: jest.fn(() => Promise.resolve()) } }));
    const notifyAdminMock = jest.fn(() => Promise.resolve());
    jest.doMock('lib/notify', () => ({ __esModule: true, notifyAdmin: notifyAdminMock }));

    jest.doMock('jsonwebtoken', () => ({ __esModule: true, verify: () => ({ address: '0xabc' }) }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/kyc-request')).default;
      const req: any = makeReq({ method: 'POST', cookies: { token: 'dummy' } });
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(200);
      expect(fakeUser.save).toHaveBeenCalled();
    });
    jest.dontMock('jsonwebtoken');
  });
});
