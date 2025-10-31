jest.setTimeout(10000);
describe('provider-stats CSV export', () => {
  it('returns CSV with providers', async () => {
    // mock admin middleware to pass through
    jest.doMock('lib/adminMiddleware', () => ({ __esModule: true, withAdminAuth: (h:any)=>h }));
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: 'p1', totalReports: 5, uniqueReporters: 3 }]);
    jest.doMock('lib/reportModel', () => ({ __esModule: true, default: { aggregate: mockAggregate } }));
    const mockFind = jest.fn().mockResolvedValue([{ _id: 'p1', name: 'TestProvider' }]);
    jest.doMock('lib/providerModel', () => ({ __esModule: true, default: { find: mockFind } }));

    await jest.isolateModulesAsync(async () => {
      const handler = (await import('../pages/api/admin/provider-stats.csv')).default;
      const writes: string[] = [];
      const res: any = {
        setHeader: jest.fn(),
        write: (s:string)=>writes.push(s),
        end: jest.fn(),
      };
      await handler({} as any, res as any);
      const csv = writes.join('');
      expect(csv).toMatch(/providerId,providerName,totalReports,uniqueReporters/);
      expect(csv).toMatch(/TestProvider/);
    });
  });
});
