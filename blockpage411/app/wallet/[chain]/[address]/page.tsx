// Server-side revalidation for wallet page; use ISR-like behavior
export const revalidate = 60;

import React from 'react';
import WalletProfileClient from './WalletProfileClient';
import { redirect } from 'next/navigation';
import { normalizeEvmChainId, EVM_CHAIN_PRIORITY, type EvmChainId } from '../../../../lib/evmChains';
import { parseSearchInput } from '../../../../lib/search/input';
import { getEvmTxCount } from '../../../../lib/evmAddressProbe';

type Props = { params: any };

async function pickBestEvmChain(address: string, preferred?: EvmChainId | null): Promise<EvmChainId | null> {
  const parsed = parseSearchInput(address);
  if (parsed.kind !== 'address' || !parsed.address) return null;

  const order: EvmChainId[] = preferred ? [preferred, ...EVM_CHAIN_PRIORITY.filter((c) => c !== preferred)] : EVM_CHAIN_PRIORITY;
  let best: { chain: EvmChainId; txCount: number } | null = null;
  for (const c of order) {
    const txCount = await getEvmTxCount(c, parsed.address, 2000);
    if (txCount == null) continue;
    if (txCount > 0) return c;
    if (!best) best = { chain: c, txCount };
  }
  return best?.chain || null;
}

export async function generateMetadata({ params }: Props) {
  const resolved = params && typeof params.then === 'function' ? await params : params;
  const { chain, address } = resolved;
  const normalized = normalizeEvmChainId(chain);
  const effectiveChain = normalized || String(chain || '');
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '';
  const apiUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/api/wallet/${effectiveChain}/${encodeURIComponent(address)}` : `/api/wallet/${effectiveChain}/${encodeURIComponent(address)}`;

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (!res.ok) {
      return {
        title: `${address} on ${chain} — Wallet Profile`,
        description: `View transaction history, risk score and community flags for ${address} on ${chain}.`,
      };
    }
    const data = await res.json();
    const displayName = data?.displayName || null;
    const title = displayName ? `${displayName} (${address}) — ${chain} · Blockpage411` : `${address} on ${chain} · Blockpage411`;
    const description = data?.shortSummary || `View transaction history, risk score and community flags for ${address} on ${chain}.`;
    const url = siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/wallet/${chain}/${encodeURIComponent(address)}` : `/wallet/${chain}/${encodeURIComponent(address)}`;
    return {
      title,
      description,
      openGraph: { title, description, url },
      twitter: { card: 'summary', title, description },
    };
  } catch (e) {
    return {
      title: `${address} on ${chain} — Wallet Profile`,
      description: `View transaction history, risk score and community flags for ${address} on ${chain}.`,
    };
  }
}

export default async function WalletProfilePage({ params }: Props) {
  const resolved = params && typeof params.then === 'function' ? await params : params;
  const { chain, address } = resolved;

  // Normalize common aliases like /wallet/eth/... -> /wallet/ethereum/...
  const normalized = normalizeEvmChainId(chain);
  if (normalized && normalized !== chain) {
    redirect(`/wallet/${encodeURIComponent(normalized)}/${encodeURIComponent(address)}`);
  }

  // Build API URL. Prefer a configured SITE_ORIGIN for absolute fetches in server environment.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '';
  const effectiveChain = normalized || String(chain || '');
  const apiUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/api/wallet/${effectiveChain}/${encodeURIComponent(address)}` : `/api/wallet/${effectiveChain}/${encodeURIComponent(address)}`;

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (!res.ok) {
      // If the user arrived on an unsupported/wrong EVM chain, auto-fallback across EVM chains
      // so we don't present a false "not found" experience.
      const parsed = parseSearchInput(String(address || ''));
      if (parsed.kind === 'address' && parsed.address) {
        const best = await pickBestEvmChain(parsed.address, normalized);
        if (best && best !== effectiveChain) {
          redirect(`/wallet/${encodeURIComponent(best)}/${encodeURIComponent(parsed.address)}`);
        }
      }

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${address} on ${chain} — Blockpage411`,
        "url": siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/wallet/${effectiveChain}/${encodeURIComponent(address)}` : `/wallet/${effectiveChain}/${encodeURIComponent(address)}`
      };
      return (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <WalletProfileClient initialData={null} chain={effectiveChain} address={address} />
        </>
      );
    }
    const data = await res.json();
    const suggested = typeof data?.suggestedChain === 'string' ? data.suggestedChain : null;
    if (suggested && suggested !== effectiveChain) {
      redirect(`/wallet/${encodeURIComponent(suggested)}/${encodeURIComponent(address)}`);
    }
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "name": data?.displayName || `${address} on ${chain}`,
      "url": siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/wallet/${effectiveChain}/${encodeURIComponent(address)}` : `/wallet/${effectiveChain}/${encodeURIComponent(address)}`,
      "description": data?.shortSummary || null,
      "sameAs": data?.socials ? Object.values(data.socials).filter(Boolean) : undefined
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <WalletProfileClient initialData={data} chain={effectiveChain} address={address} />
      </>
    );
  } catch (err) {
    return <WalletProfileClient initialData={null} chain={effectiveChain} address={address} />;
  }
}