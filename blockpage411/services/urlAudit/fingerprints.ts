import fs from 'fs/promises';
import path from 'path';

export interface KnownGoodFingerprint {
  id: string;
  label: string;
  hostname?: string;
  sha256Normalized: string;
}

export async function loadKnownGoodFingerprints(): Promise<KnownGoodFingerprint[]> {
  const fpPath = path.join(process.cwd(), 'data', 'url-fingerprints.known-good.json');
  try {
    const raw = await fs.readFile(fpPath, 'utf8');
    const parsed = JSON.parse(raw) as { fingerprints?: KnownGoodFingerprint[] };
    const fps = Array.isArray(parsed.fingerprints) ? parsed.fingerprints : [];
    return fps
      .filter((f) => f && typeof f.sha256Normalized === 'string' && f.sha256Normalized.length > 0)
      .map((f) => ({
        id: String(f.id || f.sha256Normalized.slice(0, 10)),
        label: String(f.label || f.id || 'known-good'),
        hostname: f.hostname ? String(f.hostname) : undefined,
        sha256Normalized: String(f.sha256Normalized),
      }));
  } catch {
    return [];
  }
}

export function matchKnownGoodFingerprint(
  fps: KnownGoodFingerprint[],
  params: { hostname?: string; sha256Normalized?: string }
): KnownGoodFingerprint | null {
  const sha = (params.sha256Normalized || '').trim();
  if (!sha) return null;
  const host = (params.hostname || '').toLowerCase().trim();

  for (const fp of fps) {
    if (fp.sha256Normalized !== sha) continue;
    if (fp.hostname && host && fp.hostname.toLowerCase() !== host) continue;
    return fp;
  }

  return null;
}
