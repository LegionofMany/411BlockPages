export const revalidate = 60;

import React from 'react';
import { redirect } from 'next/navigation';
import { isAddress, getAddress } from 'viem';
import WalletProfileClient from '../../[chain]/[address]/WalletProfileClient';
import { resolveWalletInput } from 'services/resolveWalletInput';

type Props = { params: any };

function normalizeDefaultChain(): string {
  const raw = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN || process.env.DEFAULT_CHAIN || 'ethereum').toLowerCase();
  if (raw === 'eth') return 'ethereum';
  if (raw === 'base') return 'base';
  return raw || 'ethereum';
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  const addressParam = String(resolvedParams?.address || '');

  const address = isAddress(addressParam) ? getAddress(addressParam) : addressParam;
  const chain = normalizeDefaultChain();

  return {
    title: `${address} — Wallet Profile`,
    description: `Wallet intelligence and reputation signals for ${address}.`,
    alternates: { canonical: `/wallet/${encodeURIComponent(addressParam)}` },
    openGraph: { title: `${address} — Wallet Profile`, description: `Wallet intelligence and reputation signals for ${address}.` },
  };
}

export default async function WalletByAddressPage({ params }: Props) {
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  const addressParam = String(resolvedParams?.address || '').trim();
  if (!addressParam) redirect('/');

  // Allow /wallet/<ens-or-domain> direct navigation.
  if (!isAddress(addressParam)) {
    const resolved = await resolveWalletInput(addressParam);
    if (resolved?.address) redirect(`/wallet/${encodeURIComponent(resolved.address)}`);
    redirect('/');
  }

  const address = getAddress(addressParam);
  const chain = normalizeDefaultChain();

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '';
  const apiUrl = siteOrigin
    ? `${siteOrigin.replace(/\/$/, '')}/api/wallet/${chain}/${encodeURIComponent(address)}`
    : `/api/wallet/${chain}/${encodeURIComponent(address)}`;

  let initialData: any = null;
  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (res.ok) initialData = await res.json();
  } catch {
    initialData = null;
  }

  return <WalletProfileClient initialData={initialData} chain={chain} address={address} />;
}
