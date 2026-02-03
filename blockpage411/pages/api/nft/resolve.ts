import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

function normalizeIpfs(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('ipfs://')) {
    const rest = trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '');
    return `https://ipfs.io/ipfs/${rest}`;
  }
  return trimmed;
}

function parseOpenSeaUrl(raw: string): { chain: string; contract: string; tokenId: string } | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (!host.endsWith('opensea.io')) return null;
    // Known patterns:
    // - /assets/<chain>/<contract>/<tokenId>
    // - /assets/<contract>/<tokenId> (older)
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('assets');
    if (idx === -1) return null;
    const rest = parts.slice(idx + 1);
    if (rest.length >= 3) {
      const [chain, contract, tokenId] = rest;
      return { chain: chain || 'ethereum', contract, tokenId };
    }
    if (rest.length >= 2) {
      const [contract, tokenId] = rest;
      return { chain: 'ethereum', contract, tokenId };
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeOpenSeaChain(chain?: string): string {
  const c = String(chain || '').toLowerCase();
  if (!c) return 'ethereum';
  const allowed = new Set(['ethereum', 'base', 'polygon', 'arbitrum', 'optimism']);
  return allowed.has(c) ? c : 'ethereum';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const input = String((req.body || {}).input || '').trim();
  if (!input) return res.status(400).json({ message: 'input is required' });

  // Direct image / ipfs link
  const normalized = normalizeIpfs(input);
  if (/^https?:\/\//i.test(normalized) && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(normalized)) {
    return res.status(200).json({ imageUrl: normalized, source: 'direct' });
  }

  // OpenSea URL -> OpenSea API
  const parsed = parseOpenSeaUrl(input);
  if (parsed) {
    const chain = normalizeOpenSeaChain(parsed.chain);
    const contract = parsed.contract;
    const tokenId = parsed.tokenId;

    const url = `https://api.opensea.io/api/v2/chain/${encodeURIComponent(chain)}/contract/${encodeURIComponent(contract)}/nfts/${encodeURIComponent(tokenId)}`;
    try {
      const resp = await axios.get(url, {
        timeout: 9000,
        headers: {
          Accept: 'application/json',
          ...(process.env.OPENSEA_API_KEY ? { 'x-api-key': process.env.OPENSEA_API_KEY } : {}),
        },
      });

      const nft = (resp.data && (resp.data.nft || resp.data)) as any;
      const imageUrlRaw = nft?.image_url || nft?.image_original_url || nft?.display_image_url || nft?.metadata?.image;
      const imageUrl = imageUrlRaw ? normalizeIpfs(String(imageUrlRaw)) : '';
      if (!imageUrl) {
        return res.status(404).json({ message: 'OpenSea returned no image for that NFT.' });
      }
      return res.status(200).json({ imageUrl, source: 'opensea', chain, contract, tokenId });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'OpenSea fetch failed';
      if (status === 429) return res.status(429).json({ message: 'OpenSea rate limited. Try again shortly.' });
      return res.status(502).json({ message: msg });
    }
  }

  // If it's a URL but not an image and not OpenSea, try to accept as-is.
  if (/^https?:\/\//i.test(normalized)) {
    return res.status(200).json({ imageUrl: normalized, source: 'url' });
  }

  return res.status(400).json({ message: 'Unsupported NFT input. Paste an OpenSea asset link or a direct image/IPFS URL.' });
}
