export interface TrustScoreInput {
  verifiedLinksCount: number;
  flagsCount: number;
}

export function computeTrustScore({ verifiedLinksCount, flagsCount }: TrustScoreInput): number {
  const base = 50;
  const socialBonus = verifiedLinksCount * 10;
  const flagPenalty = flagsCount * 5;
  const raw = base + socialBonus - flagPenalty;
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, raw));
}
