"use client";
import React from 'react';

type NftAvatarPreviewProps = {
  imageUrl?: string | null;
};

export default function NftAvatarPreview({ imageUrl }: NftAvatarPreviewProps) {
  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-black/80 p-5 text-amber-50">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80 mb-2">
        NFT avatar
      </p>
      <p className="text-xs text-amber-100/80 mb-3">
        NFT avatars are configured from your profile page. Once linked, your on-chain identity photo will appear here.
      </p>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl border border-emerald-500/60 bg-slate-900/60 overflow-hidden flex items-center justify-center text-[11px] text-emerald-200">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="NFT avatar" className="h-full w-full object-cover" />
          ) : (
            <span>No NFT linked</span>
          )}
        </div>
        <div className="text-[11px] text-emerald-100/70">
          Manage your NFT avatar under <span className="font-mono">/profile</span>. This page will automatically reflect your verified avatar.
        </div>
      </div>
    </section>
  );
}
