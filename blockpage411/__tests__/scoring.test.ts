import assert from 'assert';
import { calculateTrustScore } from '../utils/scoring';

function approxEqual(a:number,b:number) { return a===b; }

// Basic unit tests for scoring logic
(() => {
  // empty wallet
  assert.strictEqual(calculateTrustScore(undefined as any), 0, 'undefined wallet should be 0');

  // only twitter
  assert.strictEqual(calculateTrustScore({ socials: { twitter: '@user' } } as any), 10);

  // twitter + telegram
  assert.strictEqual(calculateTrustScore({ socials: { twitter: '@u', telegram: 'tg' } } as any), 20);

  // all socials
  assert.strictEqual(calculateTrustScore({ socials: { twitter: 't', telegram: 'tg', whatsapp: 'w', instagram: 'i' } } as any), 30);

  // caps at 100
  assert.strictEqual(calculateTrustScore({ socials: { twitter: 't'.repeat(10), telegram: 't'.repeat(10), whatsapp: 'w', instagram: 'i' } } as any), 30);

  console.log('scoring tests passed');
})();
