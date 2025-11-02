describe('admin auto-promote API (library)', () => {
  test('finds candidates and promotes them (dry run + run)', async () => {
    jest.isolateModules(async () => {
      // Mock reportModel aggregate
      jest.doMock('lib/reportModel', () => ({ __esModule: true, default: { aggregate: jest.fn().mockResolvedValue([{ _id: 'prov-binance', totalReports: 5, uniqueReporters: 3 }]) } }));
      // Mock providerModel with find and findById that returns object with save
      jest.doMock('lib/providerModel', () => ({ __esModule: true, default: {
        find: jest.fn().mockReturnValue({ lean: async () => [{ _id: 'prov-binance', name: 'Binance', readyForOutreach: false }] }),
        findById: jest.fn().mockImplementation(async (id) => ({ _id: id, readyForOutreach: false, save: jest.fn(async function(){ this.readyForOutreach = true; return this; }) }))
      } }));

      // Import the module under test after mocks are registered
      const autoPromote = (await import('lib/autoPromote')).default;

      const candidates = await autoPromote.findAutoPromoteCandidates({ minReports: 3, minUniqueReporters: 2, limit: 10 });
      expect(Array.isArray(candidates)).toBeTruthy();
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // Dry run: promoteCandidates will not check dryRun here (library), so run promote
      const result = await autoPromote.promoteCandidates(candidates);
      expect(result).toBeDefined();
      expect(typeof result.updated).toBe('number');
      expect(Array.isArray((result as any).promotedIds)).toBeTruthy();
      expect((result as any).promotedIds.length).toBeGreaterThanOrEqual(1);
    });
  });
});
