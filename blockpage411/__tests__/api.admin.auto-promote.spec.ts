import autoPromote from '../lib/autoPromote';

describe('autoPromote library', () => {
  test('exports functions', () => {
    expect(typeof autoPromote.findAutoPromoteCandidates).toBe('function');
    expect(typeof autoPromote.promoteCandidates).toBe('function');
  });
});
