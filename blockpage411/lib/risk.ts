import type { Document } from 'mongoose';

export type WalletLike = Document & {
  blacklisted?: boolean;
  suspicious?: boolean;
  flags?: Array<{ reason?: string }>;
  txCount?: number;
  kycStatus?: string;
  riskScore?: number;
  riskCategory?: string;
};

export function computeRiskScore(wallet: WalletLike) {
  // Admin overrides: if a riskScore/riskCategory are already set on the wallet,
  // respect them and return early so automated logic does not fight overrides.
  if (typeof wallet.riskScore === 'number' && wallet.riskCategory) {
    const clamped = Math.max(0, Math.min(100, Math.round(wallet.riskScore)));
    return { score: clamped, category: wallet.riskCategory as 'black' | 'red' | 'yellow' | 'green' } as const;
  }

  // Start with a base score (100 = highest risk)
  let score = 100;
  // blacklisted -> immediate high risk
  if (wallet.blacklisted) return { score: 100, category: 'black' };
  // suspicious flag increases score
  if (wallet.suspicious) score = Math.max(score, 85);
  // flags increase risk
  const flagsCount = Array.isArray(wallet.flags) ? wallet.flags.length : 0;
  score = Math.min(100, score + flagsCount * 3);
  // txCount: very low txCount could be suspicious (new account) but high txCount alone reduces risk
  const txCount = Number(wallet.txCount ?? 0);
  if (txCount === 0) score = Math.min(100, score + 10);
  else if (txCount > 1000) score = Math.max(0, score - 40);
  else if (txCount > 100) score = Math.max(0, score - 20);
  // kycStatus reduces or increases risk
  const kyc = String(wallet.kycStatus ?? '').toLowerCase();
  if (kyc === 'verified') score = Math.max(0, score - 60);
  else if (kyc === 'pending') score = Math.min(100, score + 10);

  // Bound score 0..100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // map to category (black=unverified/high risk, red=flagged high risk, yellow=moderate, green=low risk)
  let category: 'black' | 'red' | 'yellow' | 'green' = 'black';
  if (score >= 90) category = 'black';
  else if (score >= 70) category = 'red';
  else if (score >= 40) category = 'yellow';
  else category = 'green';

  return { score, category } as const;
}

export function humanRiskLabel(category: string) {
  switch (category) {
    case 'black': return 'Unverified / High risk';
    case 'red': return 'Flagged / High risk';
    case 'yellow': return 'Caution / Moderate risk';
    case 'green': return 'Verified / Low risk';
    default: return 'Unknown';
  }
}
