// Small client-safe helper to validate donation embed hosts.
export function isTrustedGivingBlockEmbed(urlLike: string): boolean {
  try {
    const u = new URL(String(urlLike));
    const host = u.hostname.toLowerCase();
    if (host === 'thegivingblock.com' || host.endsWith('.thegivingblock.com')) return true;
    if (host.endsWith('givingblock.com')) return true;
    return false;
  } catch {
    return false;
  }
}
