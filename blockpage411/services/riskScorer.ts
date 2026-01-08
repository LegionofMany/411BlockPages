import type { Document } from 'mongoose';

type Flag = {
  source: string;
  category: string;
  confidence: 'low' | 'medium' | 'high';
};

type BehaviorSignals = {
  rapid_fund_hopping?: boolean;
  mixer_proximity?: boolean;
  scam_cluster_exposure_score?: number;
};

// Deterministic risk scoring algorithm using suggested weights.
export function calculateRiskScore(flags: Flag[], behavior: BehaviorSignals) {
  let score = 0;

  // Heavier weight for sanctions
  for (const f of flags) {
    const src = (f.source || '').toLowerCase();
    const cat = (f.category || '').toLowerCase();
    const conf = f.confidence || 'low';
    const confMul = conf === 'high' ? 1.0 : conf === 'medium' ? 0.6 : 0.3;

    if (src.includes('ofac') || cat === 'sanctioned') {
      score += 50 * confMul;
      continue;
    }

    // Verified scam/phishing label
    if (cat === 'scam' || cat === 'phishing' || src.includes('etherscan')) {
      score += 25 * confMul;
      continue;
    }

    // Community reports and other sources
    score += 10 * confMul;
  }

  // Behavior signals
  if (behavior.rapid_fund_hopping) score += 10;
  if (behavior.mixer_proximity) score += 10;

  const exposure = Math.max(0, Math.min(20, Math.floor((behavior.scam_cluster_exposure_score || 0) * 20)));
  score += exposure;

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine level
  let level: 'low' | 'medium' | 'high' = 'low';
  if (score <= 30) level = 'low';
  else if (score <= 69) level = 'medium';
  else level = 'high';

  return { score, level };
}

export default calculateRiskScore;
