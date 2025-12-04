import type { ExternalRiskRaw } from './fetchExternalRisk';

export interface NormalizedExternalRisk {
  score: number;
  reasons: string[];
}

export function normalizeExternalData(raw: ExternalRiskRaw): NormalizedExternalRisk {
  let score = 0;
  const reasons: string[] = [];

  if (raw.etherscanFlags && raw.etherscanFlags > 0) {
    score += raw.etherscanFlags > 1 ? 50 : 20;
    reasons.push(`Etherscan/Explorer flags: ${raw.etherscanFlags}`);
  }
  if (raw.scamDbHits && raw.scamDbHits > 0) {
    score += raw.scamDbHits > 1 ? 70 : 40;
    reasons.push(`Scam database hits: ${raw.scamDbHits}`);
  }
  if (raw.socialMentions && raw.socialMentions > 0) {
    score += 10;
    reasons.push('Negative social media mentions detected');
  }
  if (raw.givingBlockVerified) {
    score -= 30;
    reasons.push('Verified charity via TheGivingBlock');
  }

  return { score, reasons };
}
