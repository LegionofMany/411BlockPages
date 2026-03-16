export interface DynamicSignalsLike {
  enabled: boolean;
  walletRequests?: Array<{ method: string; params?: any }>;
  clicked?: string[];
}

export interface DynamicScoringResult {
  delta: number;
  reasons: string[];
  methods: string[];
}

export function scoreDynamicSignals(dynamic: DynamicSignalsLike | null | undefined): DynamicScoringResult {
  if (!dynamic || !dynamic.enabled) return { delta: 0, reasons: [], methods: [] };

  const methods = Array.from(
    new Set(
      (dynamic.walletRequests || [])
        .map(w => String(w?.method || '').trim())
        .filter(Boolean)
    )
  );

  let delta = 0;
  const reasons: string[] = [];

  if (methods.length > 0) {
    delta += 10;
    reasons.push('Dynamic analysis: page attempted wallet provider calls');
  }

  if (methods.includes('eth_sendTransaction') || methods.includes('wallet_sendTransaction')) {
    delta += 35;
    reasons.push('Dynamic analysis: attempted transaction send');
  }

  if (
    methods.includes('personal_sign') ||
    methods.includes('eth_sign') ||
    methods.includes('eth_signTypedData') ||
    methods.includes('eth_signTypedData_v4')
  ) {
    delta += 25;
    reasons.push('Dynamic analysis: attempted signing');
  }

  if (methods.includes('wallet_requestPermissions') || methods.includes('eth_requestAccounts')) {
    delta += 15;
    reasons.push('Dynamic analysis: attempted account connection');
  }

  if (Array.isArray(dynamic.clicked) && dynamic.clicked.length > 0) {
    delta += 6;
    reasons.push('Dynamic analysis: clicked CTA-like elements');
  }

  return { delta, reasons, methods };
}
