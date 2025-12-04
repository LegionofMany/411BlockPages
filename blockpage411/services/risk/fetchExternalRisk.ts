export interface ExternalRiskRaw {
  // This structure can hold raw results from multiple providers
  etherscanFlags?: number;
  scamDbHits?: number;
  socialMentions?: number;
  givingBlockVerified?: boolean;
}

// Placeholder for real HTTP/API calls; currently returns mock data.
export async function fetchExternalRisk(address: string, chain: string): Promise<ExternalRiskRaw> {
  void address;
  void chain;
  return {
    etherscanFlags: 0,
    scamDbHits: 0,
    socialMentions: 0,
    givingBlockVerified: false,
  };
}
