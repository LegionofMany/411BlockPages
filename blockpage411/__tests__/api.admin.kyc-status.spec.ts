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

describe('/api/admin/kyc-status', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.ADMIN_WALLETS = '0xtestadmin';
  });

  it('returns 400 when required fields missing', async () => {
    const req: any = makeReq({ method: 'PATCH', headers: { 'x-admin-address': '0xtestadmin' } });
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/admin/kyc-status')).default;
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(400);
    });
  });

  it('returns 404 when wallet not found', async () => {
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/walletModel', () => ({ __esModule: true, default: { findOne: jest.fn(() => null) } }));
    const req: any = makeReq({ method: 'PATCH', headers: { 'x-admin-address': '0xtestadmin' }, body: { address: '0x1111111111111111111111111111111111111111', chain: 'eth', kycStatus: 'verified' } });
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/admin/kyc-status')).default;
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(404);
    });
  });

  it('updates wallet and sends email when present', async () => {
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    const fakeWallet: any = {
      address: '0x1111111111111111111111111111111111111111',
      chain: 'eth',
      kycStatus: 'pending',
      kycDetails: { email: 'user@example.com', emailVerified: true, fullName: 'Test User' },
      save: jest.fn(() => Promise.resolve()),
    };
    jest.doMock('lib/walletModel', () => ({ __esModule: true, default: { findOne: jest.fn(() => fakeWallet) } }));
    jest.doMock('lib/auditLogModel', () => ({ __esModule: true, default: { create: jest.fn(() => Promise.resolve()) } }));
    const sendKycMock = jest.fn(() => Promise.resolve());
    const sendKycPath = require.resolve('../utils/sendKycEmail');
    jest.doMock(sendKycPath, () => ({ __esModule: true, default: sendKycMock, sendKycEmail: sendKycMock }));
    const req: any = makeReq({ method: 'PATCH', headers: { 'x-admin-address': '0xtestadmin' }, body: { address: '0x1111111111111111111111111111111111111111', chain: 'eth', kycStatus: 'verified' } });

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/admin/kyc-status')).default;
      const res = makeRes();
      await handler(req as any, res);
      expect((res as any)._status).toBe(200);
      expect((res as any)._json).toMatchObject({ success: true, kycStatus: 'verified' });
    });
  });
});
