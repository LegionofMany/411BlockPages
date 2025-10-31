import handler from '../pages/api/reports/index';

function makeReq(opts: any) { return opts as any; }
function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (obj: any) => { res._json = obj; return res; };
  return res;
}

const jwt = require('jsonwebtoken');

describe('reports API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('POST without token returns 401', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
      const handler = (await import('../pages/api/reports/index')).default;
      const req = makeReq({ method: 'POST', cookies: {}, body: {} });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(401);
    });
  });

  it('POST with valid token creates report', async () => {
  const mockReportCreate = jest.fn().mockResolvedValue({ _id: 'r1', reporterUserId: '0xabc' });
  jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
  jest.doMock('lib/reportModel', () => ({ __esModule: true, default: { create: mockReportCreate } }));
  jest.doMock('lib/walletModel', () => ({ __esModule: true, default: { findById: jest.fn(), findOne: jest.fn() } }));
  jest.doMock('lib/providerModel', () => ({ __esModule: true, default: { findById: jest.fn() } }));
  const jwtMock = jest.fn(() => ({ address: '0xabc' }));
  jest.doMock('jsonwebtoken', () => ({ __esModule: true, default: { verify: jwtMock }, verify: jwtMock }));
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/reports/index')).default;
      const req = makeReq({ method: 'POST', cookies: { token: 't' }, body: { suspectAddress: '0x1', chain: 'ethereum' } });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(201);
      expect(res._json).toMatchObject({ _id: 'r1', reporterUserId: '0xabc' });
    });
  });
});
