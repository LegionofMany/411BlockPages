import axios from 'axios';

export type NftSource = 'opensea' | 'rarible' | 'ud';

export interface UnifiedNftItem {
  source: NftSource;
  name: string;
  image: string;
  tokenId: string;
  contractAddress: string;
}

type OpenSeaAsset = {
  token_id?: string;
  name?: string;
  image_url?: string;
  image_original_url?: string;
  asset_contract?: { address?: string };
};

type RaribleItem = {
  id?: string; // format: `${contract}:${tokenId}`
  meta?: {
    name?: string;
    image?: {
      url?: string | null;
      previews?: { url?: string | null }[];
    } | string | null;
  } | null;
};

type UdProfileNft = {
  tokenId?: string;
  contractAddress?: string;
  name?: string;
  image?: string;
};

function normalizeNftKey(contractAddress: string, tokenId: string): string {
  return `${contractAddress.toLowerCase()}:${tokenId}`;
}

async function fetchFromOpenSea(owner: string, signal?: AbortSignal): Promise<UnifiedNftItem[]> {
  const url = `https://api.opensea.io/api/v2/chain/ethereum/account/${owner}/nfts`;
  try {
    const res = await axios.get(url, {
      signal,
      timeout: 8000,
      headers: {
        Accept: 'application/json',
        // Optional: use an API key if configured
        ...(process.env.OPENSEA_API_KEY ? { 'x-api-key': process.env.OPENSEA_API_KEY } : {}),
      },
      params: {
        limit: 50,
      },
    });

    const assets: OpenSeaAsset[] = Array.isArray(res.data?.nfts) ? res.data.nfts : [];

    const items: UnifiedNftItem[] = [];
    for (const a of assets) {
      const tokenId = a.token_id || '';
      const contract = a.asset_contract?.address || '';
      const image = a.image_original_url || a.image_url || '';
      if (!tokenId || !contract || !image) continue;
      items.push({
        source: 'opensea',
        name: a.name || `${contract.slice(0, 6)}...${contract.slice(-4)} #${tokenId}`,
        image,
        tokenId,
        contractAddress: contract,
      });
    }
    return items;
  } catch (err: any) {
    if (axios.isCancel(err)) return [];
    if (err?.response?.status === 429) {
      console.warn('OpenSea rate limited');
      return [];
    }
    console.warn('OpenSea fetch error', err?.message || err);
    return [];
  }
}

async function fetchFromRarible(owner: string, signal?: AbortSignal): Promise<UnifiedNftItem[]> {
  const url = 'https://api.rarible.org/v0.1/items/byOwner';
  try {
    const res = await axios.get(url, {
      signal,
      timeout: 8000,
      params: {
        owner,
        size: 50,
      },
    });

    const items: RaribleItem[] = Array.isArray(res.data?.items) ? res.data.items : [];

    const unified: UnifiedNftItem[] = [];
    for (const item of items) {
      if (!item.id) continue;
      const [contract, tokenId] = item.id.split(':');
      if (!contract || !tokenId) continue;

      let image = '';
      const meta = item.meta || undefined;
      if (meta) {
        if (typeof meta.image === 'string') {
          image = meta.image;
        } else if (meta.image) {
          image = meta.image.url || meta.image.previews?.[0]?.url || '';
        }
      }

      if (!image) continue;

      unified.push({
        source: 'rarible',
        name: meta?.name || `${contract.slice(0, 6)}...${contract.slice(-4)} #${tokenId}`,
        image,
        tokenId,
        contractAddress: contract,
      });
    }

    return unified;
  } catch (err: any) {
    if (axios.isCancel(err)) return [];
    if (err?.response?.status === 429) {
      console.warn('Rarible rate limited');
      return [];
    }
    console.warn('Rarible fetch error', err?.message || err);
    return [];
  }
}

async function fetchFromUd(owner: string, signal?: AbortSignal): Promise<UnifiedNftItem[]> {
  // This is a placeholder example using a generic UD profile endpoint.
  // Adapt the URL/shape to your actual UD integration.
  const url = `https://api.ud.me/v1/profiles/${owner}`;
  try {
    const res = await axios.get(url, { signal, timeout: 8000 });
    const nft: UdProfileNft | undefined = res.data?.nft || res.data?.avatarNft || undefined;
    if (!nft || !nft.tokenId || !nft.contractAddress || !nft.image) return [];
    return [
      {
        source: 'ud',
        name: nft.name || 'UD Avatar',
        image: nft.image,
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
      },
    ];
  } catch (err: any) {
    if (axios.isCancel(err)) return [];
    console.warn('UD.me fetch error', err?.message || err);
    return [];
  }
}

export async function fetchUserNFTs(walletAddress: string, signal?: AbortSignal): Promise<UnifiedNftItem[]> {
  if (!walletAddress) return [];

  const [fromOpenSea, fromRarible, fromUd] = await Promise.all([
    fetchFromOpenSea(walletAddress, signal),
    fetchFromRarible(walletAddress, signal),
    fetchFromUd(walletAddress, signal),
  ]);

  const all = [...fromOpenSea, ...fromRarible, ...fromUd];
  const seen = new Set<string>();
  const deduped: UnifiedNftItem[] = [];

  for (const item of all) {
    const key = normalizeNftKey(item.contractAddress, item.tokenId);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}
