import { calculateTrustScore } from '../utils/scoring';

describe('calculateTrustScore', () => {
  test('returns 0 for undefined wallet', () => {
    expect(calculateTrustScore(undefined as any)).toBe(0);
  });

  test('twitter only gives 10 points', () => {
    expect(calculateTrustScore({ socials: { twitter: '@user' } } as any)).toBe(10);
  });

  test('twitter + telegram gives 20 points', () => {
    expect(calculateTrustScore({ socials: { twitter: '@u', telegram: 'tg' } } as any)).toBe(20);
  });

  test('all socials give 30 points', () => {
    expect(calculateTrustScore({ socials: { twitter: 't', telegram: 'tg', whatsapp: 'w', instagram: 'i' } } as any)).toBe(30);
  });

  test('caps at 100', () => {
    expect(calculateTrustScore({ socials: { twitter: 't'.repeat(10), telegram: 't'.repeat(10), whatsapp: 'w', instagram: 'i' } } as any)).toBe(30);
  });
});
