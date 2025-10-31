// Mock minimal req/res
function makeReq(opts: any) { return opts as any; }
function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (obj: any) => { res._json = obj; return res; };
  return res;
}

describe('providers API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET without query returns list', async () => {
    const mockFind = jest.fn(() => ({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ name: 'Binance' }]) }) }));
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/providerModel', () => ({ __esModule: true, default: { find: mockFind } }));
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/providers/index')).default;
      const req = makeReq({ method: 'GET', query: {} });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._json).toEqual([{ name: 'Binance' }]);
    });
  });

  it('POST creates pending provider', async () => {
    const mockFindOne = jest.fn().mockResolvedValue(null);
    const mockCreate = jest.fn().mockResolvedValue({ name: 'NewProvider', status: 'pending' });
    jest.doMock('lib/db', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
    jest.doMock('lib/providerModel', () => ({ __esModule: true, default: { findOne: mockFindOne, create: mockCreate } }));
    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/providers/index')).default;
      const req = makeReq({ method: 'POST', body: { name: 'NewProvider' } });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(201);
      expect(res._json).toMatchObject({ name: 'NewProvider', status: 'pending' });
    });
  });
});
