import importHelper from '../lib/importProviderHelper';

describe('importProviderHelper basic smoke', () => {
  test('exports importItems function', async () => {
    expect(typeof importHelper.importItems === 'function' || typeof importHelper === 'function').toBeTruthy();
  });
});
