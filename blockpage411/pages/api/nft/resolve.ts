import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { createPublicClient, http } from 'viem';
import { mainnet, base, polygon, arbitrum, optimism } from 'viem/chains';

const ERC721_ABI = [
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

const ERC1155_ABI = [
  {
    type: 'function',
    name: 'uri',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

type ResolveResult = { imageUrl: string; source: string; details?: Record<string, any> };

const MAX_TOTAL_MS = 8_000;
function remainingMs(startedAt: number) {
  return Math.max(0, MAX_TOTAL_MS - (Date.now() - startedAt));
}

function isAxiosTimeout(err: any) {
  return err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout');
}

function normalizeHttpUrl(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return trimmed;
  return trimmed;
}

function normalizeIpfs(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('ipfs://')) {
    const rest = trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '');
    return `https://ipfs.io/ipfs/${rest}`;
  }
  return trimmed;
}

function normalizePossibleDataUriToJson(dataUri: string): any | null {
  const s = String(dataUri || '').trim();
  if (!s.toLowerCase().startsWith('data:')) return null;
  // Support: data:application/json;base64,....
  const m = s.match(/^data:application\/(json|octet-stream);base64,(.+)$/i);
  if (!m) return null;
  try {
    const jsonStr = Buffer.from(m[2], 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function extractImageUrlFromMetadata(meta: any): string {
  if (!meta || typeof meta !== 'object') return '';
  const candidates: any[] = [];
  // Common fields
  candidates.push(meta.image, meta.image_url, meta.imageUrl, meta.imageURI, meta.image_uri, meta.image_original_url, meta.display_image_url);
  // OpenSea-ish nested
  candidates.push(meta.metadata?.image, meta.metadata?.image_url);
  // Sometimes nested under properties
  candidates.push(meta.properties?.image, meta.properties?.image_url);

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

function looksLikeImageUrlByExtension(url: string): boolean {
  const u = String(url || '').trim();
  return /^https?:\/\//i.test(u) && /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u);
}

function contentTypeLooksLikeImage(contentType: unknown): boolean {
  const ct = String(contentType || '').toLowerCase();
  return ct.startsWith('image/');
}

async function probeUrlIsImage(url: string, timeoutMs = 2500): Promise<boolean> {
  const u = normalizeIpfs(normalizeHttpUrl(url));
  if (!/^https?:\/\//i.test(u)) return false;
  try {
    const resp = await axios.get(u, {
      timeout: Math.max(500, timeoutMs),
      responseType: 'stream',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      validateStatus: () => true,
      maxRedirects: 3,
    });
    try {
      // We only need headers; stop reading the body.
      (resp.data as any)?.destroy?.();
    } catch {
      // ignore
    }
    if (resp.status < 200 || resp.status >= 300) return false;
    return contentTypeLooksLikeImage((resp.headers as any)?.['content-type']);
  } catch {
    return false;
  }
}

async function fetchMetadataAndExtractImage(url: string, timeoutMs = 4000): Promise<string> {
  const u = normalizeIpfs(normalizeHttpUrl(url));
  if (!/^https?:\/\//i.test(u)) return '';
  try {
    const resp = await axios.get(u, {
      timeout: Math.max(500, timeoutMs),
      headers: {
        Accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
      },
      // Some gateways require a UA to behave; keep it generic.
      validateStatus: () => true,
    });
    if (resp.status < 200 || resp.status >= 300) return '';

    // If the URL is actually an image (common for IPFS gateways without extensions), accept it.
    if (contentTypeLooksLikeImage((resp.headers as any)?.['content-type'])) {
      return u;
    }

    // Axios may already parse JSON.
    const data = resp.data;
    if (typeof data === 'string') {
      const maybeJson = normalizePossibleDataUriToJson(data);
      if (maybeJson) {
        const img = extractImageUrlFromMetadata(maybeJson);
        return img ? normalizeIpfs(img) : '';
      }
      // If it's a string body, try JSON parse.
      try {
        const parsed = JSON.parse(data);
        const img = extractImageUrlFromMetadata(parsed);
        return img ? normalizeIpfs(img) : '';
      } catch {
        return '';
      }
    }

    const img = extractImageUrlFromMetadata(data);
    return img ? normalizeIpfs(img) : '';
  } catch {
    return '';
  }
}

function getChainClient(chainSlug: string, timeoutMs?: number) {
  const slug = String(chainSlug || '').toLowerCase();
  const rpc = {
    ethereum:
      process.env.ETH_RPC_URL ||
      process.env.NEXT_PUBLIC_ETH_RPC_URL ||
      process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ||
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
      'https://cloudflare-eth.com',
    base: process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    polygon: process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    arbitrum: process.env.ARBITRUM_RPC_URL || process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    optimism: process.env.OPTIMISM_RPC_URL || process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  } as const;

  const chainObj =
    slug === 'base'
      ? base
      : slug === 'polygon'
        ? polygon
        : slug === 'arbitrum'
          ? arbitrum
          : slug === 'optimism'
            ? optimism
            : mainnet;

  const rpcUrl = (rpc as any)[slug] || rpc.ethereum;
  // Keep timeouts short to avoid serverless timeouts; allow overriding via env.
  const fallbackTimeout = Number(process.env.NFT_RESOLVE_RPC_TIMEOUT_MS || 3500);
  const timeout = Number.isFinite(timeoutMs as number) ? Number(timeoutMs) : fallbackTimeout;
  return createPublicClient({ chain: chainObj, transport: http(String(rpcUrl), { timeout }) });
}

function expandErc1155UriTemplate(uri: string, tokenId: bigint): string {
  const template = String(uri || '');
  if (!template.includes('{id}')) return template;
  // ERC-1155: {id} is lowercase hex, zero-padded to 64 chars.
  const hex = tokenId.toString(16).toLowerCase().padStart(64, '0');
  return template.replaceAll('{id}', hex);
}

async function resolveOpenSeaViaChain(opts: {
  chain: string;
  contract: string;
  tokenId: string;
  startedAt: number;
}): Promise<ResolveResult | null> {
  try {
    const remain = remainingMs(opts.startedAt);
    // This fallback is best-effort; keep it fast and bounded.
    if (remain < 3000) return null;

    const rpcTimeout = Math.max(600, Math.min(1000, remain - 2200));
    const metadataTimeout = Math.max(600, Math.min(2000, remain - rpcTimeout * 2 - 300));
    if (rpcTimeout < 600 || metadataTimeout < 600) return null;

    const tokenIdBig = BigInt(opts.tokenId);
    const client = getChainClient(opts.chain, rpcTimeout);
    const address = opts.contract as `0x${string}`;

    // Try ERC-721 first.
    let tokenUri: string | null = null;
    try {
      tokenUri = (await client.readContract({ address, abi: ERC721_ABI, functionName: 'tokenURI', args: [tokenIdBig] })) as any;
    } catch {
      tokenUri = null;
    }

    // Fallback: ERC-1155
    if (!tokenUri) {
      try {
        const raw = (await client.readContract({ address, abi: ERC1155_ABI, functionName: 'uri', args: [tokenIdBig] })) as any;
        tokenUri = raw ? expandErc1155UriTemplate(String(raw), tokenIdBig) : null;
      } catch {
        tokenUri = null;
      }
    }

    if (!tokenUri) return null;

    const normalizedTokenUri = normalizeIpfs(String(tokenUri));
    // tokenURI can itself be a data: JSON
    const fromData = normalizePossibleDataUriToJson(normalizedTokenUri);
    if (fromData) {
      const img = extractImageUrlFromMetadata(fromData);
      if (img) {
        return {
          imageUrl: normalizeIpfs(img),
          source: 'chain',
          details: { chain: opts.chain, contract: opts.contract, tokenId: opts.tokenId, tokenUri: 'data:' },
        };
      }
    }

    const img = await fetchMetadataAndExtractImage(normalizedTokenUri, metadataTimeout);
    if (!img) return null;
    return {
      imageUrl: img,
      source: 'chain',
      details: { chain: opts.chain, contract: opts.contract, tokenId: opts.tokenId },
    };
  } catch {
    return null;
  }
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
  const aliases: Record<string, string> = {
    eth: 'ethereum',
    ethereum: 'ethereum',
    matic: 'polygon',
    polygon: 'polygon',
    arb: 'arbitrum',
    arbitrum: 'arbitrum',
    op: 'optimism',
    optimism: 'optimism',
    base: 'base',
  };
  const normalized = aliases[c];
  if (!normalized) return '';
  const allowed = new Set(['ethereum', 'base', 'polygon', 'arbitrum', 'optimism']);
  return allowed.has(normalized) ? normalized : '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const startedAt = Date.now();

  const input = String((req.body || {}).input || '').trim();
  if (!input) return res.status(400).json({ message: 'input is required' });

  // Direct image / ipfs link
  const normalized = normalizeIpfs(input);
  if (looksLikeImageUrlByExtension(normalized)) {
    return res.status(200).json({ imageUrl: normalized, source: 'direct' });
  }

  // OpenSea URL -> OpenSea API / on-chain fallback
  // IMPORTANT: Handle this before attempting metadata fetch, since OpenSea asset pages are HTML and
  // metadata probing can waste time and trigger serverless timeouts.
  const parsed = parseOpenSeaUrl(input);
  if (parsed) {
    const chain = normalizeOpenSeaChain(parsed.chain);
    if (!chain) {
      return res.status(400).json({ message: 'Unsupported OpenSea chain in URL. Supported: ethereum, polygon, base, arbitrum, optimism.' });
    }
    const contract = parsed.contract;
    const tokenId = parsed.tokenId;

    const url = `https://api.opensea.io/api/v2/chain/${encodeURIComponent(chain)}/contract/${encodeURIComponent(contract)}/nfts/${encodeURIComponent(tokenId)}`;

    // Keep OpenSea fetch short; if it times out, don't attempt additional slow fallbacks.
    const openSeaTimeout = Math.min(3500, Math.max(1000, remainingMs(startedAt) - 500));
    if (openSeaTimeout <= 1000) {
      return res.status(504).json({ message: 'NFT resolve timed out. Please try again.' });
    }

    try {
      const resp = await axios.get(url, {
        timeout: openSeaTimeout,
        headers: {
          Accept: 'application/json',
          ...(process.env.OPENSEA_API_KEY ? { 'x-api-key': process.env.OPENSEA_API_KEY } : {}),
        },
        validateStatus: () => true,
      });

      if (resp.status >= 200 && resp.status < 300) {
        const nft = (resp.data && (resp.data.nft || resp.data)) as any;
        const imageUrlRaw = nft?.image_url || nft?.image_original_url || nft?.display_image_url || nft?.metadata?.image;
        const imageUrl = imageUrlRaw ? normalizeIpfs(String(imageUrlRaw)) : '';
        if (imageUrl) {
          return res.status(200).json({ imageUrl, source: 'opensea', chain, contract, tokenId });
        }
      }

      // OpenSea didn't give us an image (or non-2xx). Try on-chain if we still have time.
      if (remainingMs(startedAt) < 3000) {
        return res.status(504).json({ message: 'NFT resolve timed out. Please try again.' });
      }

      const chainResolved = await resolveOpenSeaViaChain({ chain, contract, tokenId, startedAt });
      if (chainResolved?.imageUrl) {
        return res.status(200).json({ imageUrl: chainResolved.imageUrl, source: chainResolved.source, chain, contract, tokenId });
      }

      if (resp.status === 429) {
        return res.status(429).json({ message: 'OpenSea rate limited and on-chain fallback failed. Try again shortly.' });
      }

      // Treat 404 from OpenSea as "not found" when chain fallback also fails.
      if (resp.status === 404) return res.status(404).json({ message: 'No image found for that NFT.' });

      const msg = (resp.data as any)?.message || 'OpenSea fetch failed.';
      return res.status(502).json({ message: msg });
    } catch (err: any) {
      if (isAxiosTimeout(err)) {
        return res.status(504).json({ message: 'NFT resolve timed out. Please try again.' });
      }

      // For other OpenSea failures, attempt on-chain fallback if we still have time.
      if (remainingMs(startedAt) >= 3000) {
        const chainResolved = await resolveOpenSeaViaChain({ chain, contract, tokenId, startedAt });
        if (chainResolved?.imageUrl) {
          return res.status(200).json({ imageUrl: chainResolved.imageUrl, source: chainResolved.source, chain, contract, tokenId });
        }
      }

      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'OpenSea fetch failed';
      if (status === 429) return res.status(429).json({ message: 'OpenSea rate limited and on-chain fallback failed. Try again shortly.' });
      return res.status(502).json({ message: msg });
    }
  }

  // If the user pasted a metadata URL (JSON), try extracting the image first.
  if (/^https?:\/\//i.test(normalized)) {
    if (remainingMs(startedAt) < 1500) {
      return res.status(504).json({ message: 'NFT resolve timed out. Please try again.' });
    }
    const metaTimeout = Math.min(3000, Math.max(800, remainingMs(startedAt) - 500));
    const fromMeta = await fetchMetadataAndExtractImage(normalized, metaTimeout);
    if (fromMeta) {
      return res.status(200).json({ imageUrl: fromMeta, source: 'metadata' });
    }
  }

  // If it's a URL that doesn't look like an image and isn't metadata JSON, it might still be an image.
  if (/^https?:\/\//i.test(normalized)) {
    const remain = remainingMs(startedAt);
    if (remain < 1200) {
      return res.status(504).json({ message: 'NFT resolve timed out. Please try again.' });
    }
    const probeTimeout = Math.min(2500, Math.max(700, remain - 500));
    const ok = await probeUrlIsImage(normalized, probeTimeout);
    if (ok) {
      return res.status(200).json({ imageUrl: normalized, source: 'content-type' });
    }
    return res.status(400).json({ message: 'That URL did not resolve to an image. Paste a direct image URL, an IPFS URL, an OpenSea asset link, or a metadata JSON URL with an image field.' });
  }

  return res.status(400).json({ message: 'Unsupported NFT input. Paste an OpenSea asset link or a direct image/IPFS URL.' });
}
