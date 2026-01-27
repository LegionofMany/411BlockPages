export type ReputationInput = {
  riskScore: number | null;
  txRatingAvg: number;
  txRatingCount: number;
};

export type ReputationOutput = {
  score: number | null;
  label: string;
};

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function clamp100(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export function computeReputation({ riskScore, txRatingAvg, txRatingCount }: ReputationInput): ReputationOutput {
  const hasRisk = typeof riskScore === 'number' && Number.isFinite(riskScore);
  const hasTxRatings = typeof txRatingCount === 'number' && txRatingCount > 0;

  if (!hasRisk && !hasTxRatings) {
    return { score: null, label: 'Unknown' };
  }

  const safetyScore = hasRisk ? clamp100(100 - Math.round(riskScore!)) : null;

  // Map 1..5 -> 0..100
  const txScore = hasTxRatings ? clamp100(clamp01((txRatingAvg - 1) / 4) * 100) : null;

  // Weight risk higher than tx rating, but still allow tx ratings to influence.
  let combined = 0;
  if (safetyScore != null && txScore != null) combined = 0.7 * safetyScore + 0.3 * txScore;
  else combined = (safetyScore ?? txScore ?? 0);

  const score = clamp100(combined);
  const label =
    score >= 80 ? 'Strong' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Mixed' :
    score >= 20 ? 'Caution' :
    'High risk signals';

  return { score, label };
}
