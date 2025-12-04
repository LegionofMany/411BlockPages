import { evaluateInternalRisk } from './evaluateInternalRisk';
import { fetchExternalRisk } from './fetchExternalRisk';
import { normalizeExternalData } from './normalizeExternalData';

export type RiskCategory = 'green' | 'yellow' | 'red';

export interface WalletRiskInput {
  address: string;
  chain: string;
}

export interface WalletRiskScore {
  address: string;
  chain: string;
  score: number; // 0-100
  category: RiskCategory;
  reasons: string[];
  updatedAt: string;
}

export async function calculateRiskScore(input: WalletRiskInput): Promise<WalletRiskScore> {
  const internal = await evaluateInternalRisk(input.address, input.chain);
  const externalRaw = await fetchExternalRisk(input.address, input.chain);
  const external = normalizeExternalData(externalRaw);

  let score = 0;
  const reasons: string[] = [];

  score += internal.score;
  reasons.push(...internal.reasons);

  score += external.score;
  reasons.push(...external.reasons);

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let category: RiskCategory = 'green';
  if (score > 60) category = 'red';
  else if (score > 25) category = 'yellow';

  return {
    address: input.address,
    chain: input.chain,
    score,
    category,
    reasons,
    updatedAt: new Date().toISOString(),
  };
}
