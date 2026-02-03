export type SocialCreditComponentId =
  | 'base_signin'
  | 'telegram'
  | 'twitter'
  | 'discord_profile'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'website'
  | 'email_verified'
  | 'avatar'
  | 'chain_bonus'
  | 'rating_adjustment';

export type SocialCreditComponent = {
  id: SocialCreditComponentId;
  label: string;
  points: number;
  maxPoints: number;
  achieved: boolean;
  detail?: string;
};

export type SocialCreditScoreResult = {
  total: number;
  maxTotal: number;
  components: SocialCreditComponent[];
  completedTabs: number;
  totalTabs: number;
  discordEligible: boolean;
};

export type SocialCreditScoreInput = {
  baseVerifiedAt?: string | Date | null;
  kycStatus?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  discord?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  website?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  avatarUrl?: string | null;
  nftAvatarUrl?: string | null;
  connectedChains?: string[] | null;
  walletAvgRating?: number | null;
  walletRatingsCount?: number | null;
};

function hasValue(v: unknown): boolean {
  return typeof v === 'string' ? v.trim().length > 0 : !!v;
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}

export const SOCIAL_CREDIT_MAX = 795;
export const SOCIAL_CREDIT_BASE_POINTS = 400;
export const SOCIAL_CREDIT_TAB_POINTS = 43;
export const SOCIAL_CREDIT_TABS_TOTAL = 9;
export const SOCIAL_CREDIT_CHAIN_BONUS_MAX = 8;

/**
 * Client request implementation:
 * - Base sign-in: 400 pts
 * - 9 tabs @ 43 pts each: 387 pts
 * - Blockchain bonus: up to 8 pts
 * => 400 + 387 + 8 = 795
 */
export function computeSocialCreditScore(input: SocialCreditScoreInput): SocialCreditScoreResult {
  const components: SocialCreditComponent[] = [];

  const baseVerified = !!input.baseVerifiedAt;
  components.push({
    id: 'base_signin',
    label: 'Base wallet sign-in',
    points: baseVerified ? SOCIAL_CREDIT_BASE_POINTS : 0,
    maxPoints: SOCIAL_CREDIT_BASE_POINTS,
    achieved: baseVerified,
    detail: baseVerified
      ? 'Completed'
      : 'Required to unlock highest trust tier and KYC flow',
  });

  // 9 “tabs” worth 43 points each. We map these to concrete profile fields.
  const tabChecks: Array<{ id: SocialCreditComponentId; label: string; ok: boolean; detail?: string }> = [
    { id: 'telegram', label: 'Telegram provided', ok: hasValue(input.telegram) },
    { id: 'twitter', label: 'Twitter/X provided', ok: hasValue(input.twitter) },
    { id: 'discord_profile', label: 'Discord handle provided', ok: hasValue(input.discord) },
    { id: 'instagram', label: 'Instagram provided', ok: hasValue(input.instagram) },
    { id: 'facebook', label: 'Facebook provided', ok: hasValue(input.facebook) },
    { id: 'linkedin', label: 'LinkedIn provided', ok: hasValue(input.linkedin) },
    { id: 'website', label: 'Website provided', ok: hasValue(input.website) },
    {
      id: 'email_verified',
      label: 'Email verified',
      ok: hasValue(input.email) && !!input.emailVerified,
      detail: !hasValue(input.email) ? 'Add email' : input.emailVerified ? 'Verified' : 'Verify email',
    },
    {
      id: 'avatar',
      label: 'Identity avatar set',
      ok: hasValue(input.nftAvatarUrl) || hasValue(input.avatarUrl),
      detail: hasValue(input.nftAvatarUrl) ? 'NFT avatar' : hasValue(input.avatarUrl) ? 'Profile avatar' : 'Missing',
    },
  ];

  const completedTabs = tabChecks.filter((t) => t.ok).length;
  for (const t of tabChecks) {
    components.push({
      id: t.id,
      label: t.label,
      points: t.ok ? SOCIAL_CREDIT_TAB_POINTS : 0,
      maxPoints: SOCIAL_CREDIT_TAB_POINTS,
      achieved: t.ok,
      detail: t.detail,
    });
  }

  // “More blockchain scores. Add 1 point” — award +1 per connected chain (max 8)
  // so the score can max out exactly at 795.
  const chainCount = Array.isArray(input.connectedChains)
    ? input.connectedChains.filter(Boolean).length
    : 0;
  const chainBonus = clampInt(chainCount, 0, SOCIAL_CREDIT_CHAIN_BONUS_MAX);
  components.push({
    id: 'chain_bonus',
    label: 'Blockchain bonus',
    points: chainBonus,
    maxPoints: SOCIAL_CREDIT_CHAIN_BONUS_MAX,
    achieved: chainBonus > 0,
    detail: `${chainBonus}/${SOCIAL_CREDIT_CHAIN_BONUS_MAX} (+1 per connected chain)`,
  });

  // Rating adjustment:
  // - 5-star reputation increases by +1 point
  // - 1-star reputation decreases by -5 points
  // We approximate using wallet avg rating.
  const avg = typeof input.walletAvgRating === 'number' ? input.walletAvgRating : null;
  const count = typeof input.walletRatingsCount === 'number' ? input.walletRatingsCount : null;
  let ratingAdjustment = 0;
  if (avg != null && Number.isFinite(avg) && (count || 0) > 0) {
    if (avg >= 4.75) ratingAdjustment = 1;
    if (avg <= 1.25) ratingAdjustment = -5;
  }
  components.push({
    id: 'rating_adjustment',
    label: 'Community rating adjustment',
    points: ratingAdjustment,
    maxPoints: 1,
    achieved: ratingAdjustment !== 0,
    detail: avg == null ? 'No ratings yet' : `avg ${avg.toFixed(2)} (${count || 0} ratings)`,
  });

  const rawTotal = components.reduce((sum, c) => sum + c.points, 0);
  const total = clampInt(rawTotal, 0, SOCIAL_CREDIT_MAX);

  const discordEligible = baseVerified && completedTabs === SOCIAL_CREDIT_TABS_TOTAL;

  return {
    total,
    maxTotal: SOCIAL_CREDIT_MAX,
    components,
    completedTabs,
    totalTabs: SOCIAL_CREDIT_TABS_TOTAL,
    discordEligible,
  };
}
