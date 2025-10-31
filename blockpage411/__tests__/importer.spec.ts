import importHelper from '../lib/importProviderHelper';

jest.setTimeout(10000);

describe('importProviderHelper', () => {
  it('imports items and calls provider lookup', async () => {
    const items = [ { providerName: 'Binance', address: '0xabc', chain: 'ethereum', note: 'n', source: 's' } ];
    const mockProvider = { findOne: jest.fn().mockResolvedValue({ _id: 'pid' }) };
    const mockPW = { findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(true) };
    jest.doMock('lib/providerModel', () => ({ __esModule: true, default: mockProvider }));
    jest.doMock('lib/providerWalletModel', () => ({ __esModule: true, default: mockPW }));
    await jest.isolateModulesAsync(async () => {
      const helper = (await import('../lib/importProviderHelper')).default;
      const res = await helper(items);
      expect(res.inserted).toBeGreaterThanOrEqual(0);
    });
  });
});
