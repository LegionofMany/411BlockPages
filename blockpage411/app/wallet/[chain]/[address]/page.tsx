// Server-side revalidation for wallet page; use ISR-like behavior
export const revalidate = 60;

import React from 'react';
import WalletProfileClient from './WalletProfileClient';

type Props = { params: any };

export async function generateMetadata({ params }: Props) {
  const resolved = params && typeof params.then === 'function' ? await params : params;
  const { chain, address } = resolved;
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '';
  const apiUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/api/wallet/${chain}/${encodeURIComponent(address)}` : `/api/wallet/${chain}/${encodeURIComponent(address)}`;

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

  // Build API URL. Prefer a configured SITE_ORIGIN for absolute fetches in server environment.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '';
  const apiUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/api/wallet/${chain}/${encodeURIComponent(address)}` : `/api/wallet/${chain}/${encodeURIComponent(address)}`;

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (!res.ok) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${address} on ${chain} — Blockpage411`,
        "url": siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/wallet/${chain}/${encodeURIComponent(address)}` : `/wallet/${chain}/${encodeURIComponent(address)}`
      };
      return (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <WalletProfileClient initialData={null} chain={chain} address={address} />
        </>
      );
    }
    const data = await res.json();
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "name": data?.displayName || `${address} on ${chain}`,
      "url": siteOrigin ? `${siteOrigin.replace(/\/$/, '')}/wallet/${chain}/${encodeURIComponent(address)}` : `/wallet/${chain}/${encodeURIComponent(address)}`,
      "description": data?.shortSummary || null,
      "sameAs": data?.socials ? Object.values(data.socials).filter(Boolean) : undefined
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <WalletProfileClient initialData={data} chain={chain} address={address} />
      </>
    );
  } catch (err) {
    return <WalletProfileClient initialData={null} chain={chain} address={address} />;
  }
}