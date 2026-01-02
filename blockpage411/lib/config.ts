export const DEFAULT_FLAG_THRESHOLD = 5;

export function getBalanceFlagThreshold(): number {
  const envVal = process.env.BALANCE_FLAG_THRESHOLD;
  if (!envVal) return DEFAULT_FLAG_THRESHOLD;
  const n = Number(envVal);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_FLAG_THRESHOLD;
}

// Import cloudinary validation as a side-effect so any server-side process
// that imports config will surface Cloudinary misconfiguration early.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./cloudinary');
} catch (e) {
  // ignore — cloudinary helper may not be available in some minimal environments
}
