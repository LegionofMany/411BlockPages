"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import DonationQR from './DonationQR';
import { explorerUrlFor } from '../lib/explorer';

export default function CharityCard({ charity }: { charity: any }) {
  const [showEmbed, setShowEmbed] = useState(false);

  const [logoFailed, setLogoFailed] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(charity.wallet || '');
      alert('Wallet address copied to clipboard');
    } catch {
      alert('Copy failed — please select and copy manually');
    }
  };

  function deriveChainLabel() {
    const chain = (charity.chain || '').toString().toLowerCase();
    if (chain) return chain.toUpperCase();
    const addr = String(charity.wallet || '');
    if (/^0x[a-f0-9]{40}$/i.test(addr)) return 'ETH';
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) return 'BTC';
    if (/^[A-Za-z2-9]{32,44}$/.test(addr)) return 'SOL';
    return '';
  }

  return (
    <div className="p-4 rounded-lg shadow-md bg-white/5">
      <div className="flex items-center gap-4">
        {charity.logo && !logoFailed ? (
          <Image
            src={charity.logo}
            alt={charity.name}
            width={80}
            height={40}
            style={{ objectFit: 'contain' }}
            onError={() => setLogoFailed(true)}
            placeholder="blur"
            blurDataURL={"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='100%25' height='100%25' fill='%230b1220'/%3E%3C/svg%3E"}
            unoptimized
          />
        ) : (
          <Image src="/icons/charity-placeholder.svg" alt="charity placeholder" width={80} height={40} unoptimized />
        )}
        <div>
          <div className="font-bold text-lg">{charity.name}</div>
          <div className="text-sm text-slate-300">{charity.website}</div>
          {deriveChainLabel() ? <div className="text-xs text-amber-200 mt-1">{deriveChainLabel()}</div> : null}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">{charity.description}</p>

      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {charity.givingBlockEmbedUrl ? (
          <>
            <button
              className="btn"
              onClick={() => setShowEmbed((s) => !s)}
              aria-expanded={showEmbed}
              aria-controls={`donate-embed-${charity._id || (charity.name||'')}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowEmbed(s => !s); } }}
            >
              {showEmbed ? 'Hide Donate' : 'Donate (Giving Block)'}
            </button>
            {showEmbed ? (
              <div id={`donate-embed-${charity._id || (charity.name||'')}`} className="w-full mt-3">
                <iframe title={`donate-${charity._id || charity.name}`} src={charity.givingBlockEmbedUrl} style={{ width: '100%', height: 360, border: '1px solid rgba(255,255,255,0.06)' }} sandbox="allow-forms allow-scripts allow-same-origin allow-popups" />
              </div>
            ) : null}
          </>
        ) : null}

        {charity.wallet ? (
          <>
            <button
              className="btn btn-outline"
              onClick={onCopy}
              aria-label={`Copy wallet ${charity.wallet}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCopy(); } }}
            >
              Copy Wallet
            </button>
            {(() => {
              const explorer = explorerUrlFor(charity.wallet, charity.chain);
              if (explorer) {
                return (
                  <a className="btn btn-primary" href={explorer} target="_blank" rel="noopener noreferrer">View on Explorer</a>
                );
              }
              // fallback to internal search page when we can't determine an external explorer
              return (
                <a className="btn btn-primary" href={`/search?q=${encodeURIComponent(charity.wallet)}`} target="_blank" rel="noopener noreferrer">Search</a>
              );
            })()}
            <div className="ml-2"><DonationQR address={charity.wallet} /></div>
          </>
        ) : null}
      </div>
    </div>
  );
}
