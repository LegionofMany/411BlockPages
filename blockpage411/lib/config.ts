export const DEFAULT_FLAG_THRESHOLD = 5;

export function getBalanceFlagThreshold(): number {
  const envVal = process.env.BALANCE_FLAG_THRESHOLD;
  if (!envVal) return DEFAULT_FLAG_THRESHOLD;
  const n = Number(envVal);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_FLAG_THRESHOLD;
}
