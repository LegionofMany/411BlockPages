"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserProfile({ walletAddress, compact = false, chain }: { walletAddress: string; compact?: boolean; chain?: string }){
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function proxiedAvatarSrc(src: string) {
    const s = String(src || '');
    if (!s) return s;
    // Avoid browser privacy warnings by fetching Cloudinary images via our origin.
    if (s.startsWith('https://res.cloudinary.com/')) {
      return `/_next/image?url=${encodeURIComponent(s)}&w=96&q=75`;
    }
    return s;
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!walletAddress) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(walletAddress)}`, { cache: 'no-store' });
        if (!res.ok) { setProfile(null); return; }
        const data = await res.json();
        if (!mounted) return;
        setProfile(data);
      } catch {
        // ignore
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [walletAddress]);

  function short(addr?: string) {
    if (!addr) return '';
    return addr.slice(0,6) + '…' + addr.slice(-4);
  }

  const padClass = compact ? 'px-2.5 py-2' : 'px-3.5 py-3';
  const avatarSizeClass = compact ? 'h-9 w-9' : 'h-11 w-11';
  const titleClass = compact ? 'text-sm' : 'text-base';

  const navigateToWallet = () => {
    const defaultChain = chain || (process.env.NEXT_PUBLIC_DEFAULT_CHAIN as string) || 'eth';
    router.push(`/wallet/${encodeURIComponent(defaultChain)}/${encodeURIComponent(walletAddress)}`);
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 ${padClass}`}>
        <div className={`${avatarSizeClass} rounded-full bg-slate-800/80 border border-white/10`} />
        <div className="min-w-0">
          <div className="h-3 w-40 rounded bg-slate-800/70" />
          <div className="mt-2 h-2.5 w-56 max-w-[60vw] rounded bg-slate-800/50" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 ${padClass}`}>
        <div className={`${avatarSizeClass} rounded-full bg-slate-800/80 border border-white/10`} />
        <div className="min-w-0">
          <div className={`font-semibold ${titleClass} text-slate-100`}>{short(walletAddress)}</div>
          <div className="mt-0.5 text-xs text-slate-400">Wallet profile</div>
        </div>
      </div>
    );
  }

  const hasProfile = profile?.exists !== false;
  const displayName = (hasProfile && profile.displayName) ? String(profile.displayName) : short(profile.address);
  const description = hasProfile
    ? (profile.bio
        ? (String(profile.bio).length > 120 ? String(profile.bio).slice(0, 117) + '…' : String(profile.bio))
        : short(profile.address))
    : 'No profile yet';

  return (
    <button
      type="button"
      onClick={navigateToWallet}
      className={`group inline-flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-black/30 ${padClass} text-left transition-colors hover:bg-black/40 hover:border-emerald-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40`}
      aria-label={`Open wallet profile ${displayName}`}
    >
      <div className={`relative ${avatarSizeClass} rounded-full overflow-hidden border border-emerald-400/30 bg-slate-950/60 flex-shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxiedAvatarSrc(profile.avatarUrl || '/default-avatar.png')}
          alt="Wallet avatar"
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            try {
              const src = img?.getAttribute('src') || img?.src;
              if (src && !String(src).endsWith('/default-avatar.png')) {
                // eslint-disable-next-line no-console
                console.warn('Avatar image failed to load:', src);
              }
            } catch {
              // ignore
            }
            if (img && img.src && !img.src.endsWith('/default-avatar.png')) img.src = '/default-avatar.png';
          }}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
      </div>

      <div className="min-w-0">
        <div className={`font-semibold ${titleClass} text-slate-100 leading-tight truncate group-hover:text-white`}>
          {displayName}
        </div>
        <div className="mt-0.5 text-xs text-slate-300/90 leading-snug line-clamp-2">
          {description}
        </div>
      </div>
    </button>
  );
}
