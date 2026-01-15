import WalletModel from '../lib/walletModel';
import { computeTrustScore } from './trustScoreService';

export interface WalletVisibilityContext {
  heavyFlagThreshold: number;
}

export function computeWalletVisibility(wallet: any, viewerAddress?: string | null, ctx?: WalletVisibilityContext) {
  const heavyFlagThreshold = ctx?.heavyFlagThreshold ?? Number(process.env.HEAVY_FLAG_THRESHOLD || '10');
  const isOwner = viewerAddress && wallet && wallet.address && viewerAddress.toLowerCase() === String(wallet.address).toLowerCase();

  const flagsCount = Number(wallet.flagsCount || 0);
  const unlockLevel = Number(wallet.unlockLevel || 0);
  const isPublic = Boolean(wallet.isPublic);

  const heavilyFlagged = flagsCount >= heavyFlagThreshold;

  // Visibility rules (legacy semantics for canSeeBalance):
  // - Owners always see balances.
  // - Non-owners see balances only if heavily flagged or wallet explicitly public/unlocked.
  const canSeeBalance = !!(
    isOwner ||
    heavilyFlagged ||
    isPublic ||
    unlockLevel >= 1
  );

  // New requirement: analysis pages should remain viewable read-only.
  // This does not imply sensitive details should be hidden/shown; it’s a separate signal.
  const canSeePublicAnalysis = true;

  return {
    canSeeBalance,
    canSeeSensitiveDetails: canSeeBalance,
    canSeePublicAnalysis,
    isOwner,
    heavilyFlagged,
    isPublic,
    unlockLevel,
  };
}

export interface RiskScoreInput {
  wallet: any;
  verifiedLinksCount: number;
  flagsCount: number;
  ratingsAverage: number;
  ratingsCount: number;
  txCount: number;
  lastTxWithinHours: number;
}

export function computeRiskScore(input: RiskScoreInput): { riskScore: number; riskCategory: string } {
  const {
    wallet,
    verifiedLinksCount,
    flagsCount,
    ratingsAverage,
    ratingsCount,
    txCount,
    lastTxWithinHours,
  } = input;

  // If the wallet already has an explicit riskScore / riskCategory (admin override),
  // always respect that instead of recomputing.
  if (wallet && typeof wallet.riskScore === 'number' && wallet.riskCategory) {
    const clamped = Math.max(0, Math.min(100, Math.round(wallet.riskScore)));
    return { riskScore: clamped, riskCategory: wallet.riskCategory };
  }

  // Base trust score from existing helper (0-100, higher is more trusted)
  const trustScore = computeTrustScore({ verifiedLinksCount, flagsCount });

  // Ratings: positive ratings improve trust; low rating averages reduce it.
  let ratingDelta = 0;
  if (ratingsCount > 0) {
    ratingDelta = (ratingsAverage - 3) * 5; // +/-10 max influence
  }

  // Activity: very recent activity slightly increases risk; very old reduces it.
  let activityRisk = 0;
  if (lastTxWithinHours < 1) activityRisk += 10;
  else if (lastTxWithinHours < 24) activityRisk += 5;
  else if (lastTxWithinHours > 24 * 30) activityRisk -= 5;

  // Transaction volume: extremely high tx count slightly increases risk (potential mixers/bots).
  if (txCount > 1000) activityRisk += 10;
  else if (txCount > 100) activityRisk += 5;

  // Start from inverted trust score as risk baseline.
  let riskScore = 100 - trustScore;

  // Apply ratings + activity adjustments.
  riskScore += -ratingDelta; // good ratings lower risk
  riskScore += activityRisk;

  if (!Number.isFinite(riskScore)) riskScore = 50;
  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskCategory: string = 'green';
  if (riskScore >= 80) riskCategory = 'black';
  else if (riskScore >= 60) riskCategory = 'red';
  else if (riskScore >= 40) riskCategory = 'yellow';

  return { riskScore, riskCategory };
}
