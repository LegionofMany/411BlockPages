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

  if (loading) return <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-slate-700"/> <div>Loading…</div></div>;
  if (!profile) return <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-slate-700"/> <div>{short(walletAddress)}</div></div>;

  const hasProfile = profile?.exists !== false;

  return (
    <div className={`flex items-center gap-3 ${compact ? 'text-sm' : ''}`}>
      <img
        src={proxiedAvatarSrc(profile.avatarUrl || '/default-avatar.png')}
        alt="avatar"
        className="h-10 w-10 rounded-full object-cover"
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
      <div className="flex flex-col">
        <button onClick={() => {
            const defaultChain = chain || (process.env.NEXT_PUBLIC_DEFAULT_CHAIN as string) || 'eth';
            router.push(`/wallet/${encodeURIComponent(defaultChain)}/${encodeURIComponent(walletAddress)}`);
          }} className="text-left">
          <div className="font-semibold">{(hasProfile && profile.displayName) ? profile.displayName : short(profile.address)}</div>
          <div className="text-xs text-slate-400">
            {hasProfile
              ? (profile.bio
                  ? (profile.bio.length > 80 ? profile.bio.slice(0, 77) + '…' : profile.bio)
                  : short(profile.address))
              : 'No profile yet'}
          </div>
        </button>
      </div>
    </div>
  );
}
