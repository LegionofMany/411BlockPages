export function calculateTrustScore(wallet: any) {
  let score = 0;
  if (!wallet) return 0;
  if (wallet?.socials?.twitter) score += 10;
  if (wallet?.socials?.telegram) score += 10;
  if (wallet?.socials?.whatsapp) score += 5;
  if (wallet?.socials?.instagram) score += 5;
  return Math.min(score, 100);
}
