export type WalletSocials = {
  twitter?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
};

export type WalletLike = {
  socials?: WalletSocials | null;
} | null | undefined;

export function calculateTrustScore(wallet: WalletLike): number {
  let score = 0;
  if (!wallet) return 0;
  if (wallet?.socials?.twitter) score += 10;
  if (wallet?.socials?.telegram) score += 10;
  if (wallet?.socials?.whatsapp) score += 5;
  if (wallet?.socials?.instagram) score += 5;
  return Math.min(score, 100);
}
