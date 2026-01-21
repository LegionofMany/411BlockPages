"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Skeleton from '../components/ui/Skeleton';
import Toast from '../components/ui/Toast';
import RiskBadge from '../../components/RiskBadge';
import UserProfile from '../components/UserProfile';
import type { UnifiedNftItem } from '../../services/nfts';
import { consumeDeferredAction } from '../components/auth/deferredAction';
import { useSearchParams } from 'next/navigation';
import { useEvmWallet } from '../../components/EvmWalletProvider';

interface EventItem {
  _id: string;
  title: string;
  description: string;
  goalAmount: number;
  deadline: string;
  recipientWallet: string;
  givingBlockCharityId?: string;
}

interface MeResponse {
  _id: string;
  address: string;
  ensName?: string | null;
  baseName?: string | null;
  primaryName?: string | null;
  displayName?: string;
  udDomain?: string | null;
  directoryOptIn?: boolean;
  nftAvatarUrl?: string;
  socialLinks?: {
    trustScore?: number;
  };
  connectedChains?: string[];
  reputation?: {
    score: number | null;
    label: string;
    tooltip?: string;
    riskScore?: number | null;
    riskCategory?: string | null;
  };
  activity?: { type: string; createdAt?: string | null; summary: string }[];
  featuredCharityId?: string;
  activeEventId?: string;
  donationLink?: string;
  donationWidgetEmbed?: {
    widgetId?: string;
    charityId?: string;
  };
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}

function ProfilePageInner() {
  const [tab, setTab] = useState<'profile' | 'events'>('events');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [featuredCharity, setFeaturedCharity] = useState<any | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [walletMeta, setWalletMeta] = useState({ chain: 'eth', exchangeSource: '', storageType: '' });
  const [metadataOptions, setMetadataOptions] = useState<{ exchanges: string[]; coldWallets: string[]; softWallets: string[] }>({ exchanges: [], coldWallets: [], softWallets: [] });
  const [meLoading, setMeLoading] = useState(true);
  const [savingWalletMeta, setSavingWalletMeta] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    recipientWallet: '',
    givingBlockCharityId: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const {
    connectMetaMask,
    getSigner,
    provider: evmProvider,
    address: connectedWalletAddress,
    isConnected,
  } = useEvmWallet();

  const [nftChain, setNftChain] = useState<string>('ethereum');

  const rawRedirectTo = searchParams?.get('redirectTo') || '';
  const safeRedirectTo = rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//') ? rawRedirectTo : '';

  function chainSlugFromChainId(chainId: number): string {
    switch (chainId) {
      case 1:
        return 'ethereum';
      case 8453:
        return 'base';
      case 137:
        return 'polygon';
      case 42161:
        return 'arbitrum';
      case 10:
        return 'optimism';
      default:
        return 'ethereum';
    }
  }

  async function detectNftChain(): Promise<string> {
    try {
      const hex = (await evmProvider?.request({ method: 'eth_chainId' })) as unknown;
      const chainIdHex = typeof hex === 'string' ? hex : '';
      const chainId = Number.parseInt(chainIdHex, 16);
      if (!Number.isFinite(chainId)) return 'ethereum';
      return chainSlugFromChainId(chainId);
    } catch {
      return 'ethereum';
    }
  }

  const [nftImageUrl, setNftImageUrl] = useState<string>('');
  const [nftInput, setNftInput] = useState<string>('');
  const [nftSource, setNftSource] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connectingWallet, setConnectingWallet] = useState<boolean>(false);
  const [nftError, setNftError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<UnifiedNftItem[]>([]);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [nftsError, setNftsError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskCategory, setRiskCategory] = useState<'green' | 'yellow' | 'red' | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setMe(data);
        if (data.nftAvatarUrl) {
          setNftImageUrl(data.nftAvatarUrl);
          setNftInput(data.nftAvatarUrl);
          setNftSource(null);
        }
        try {
          if (data.featuredCharityId) {
            const charityRes = await fetch(`/api/charities/${encodeURIComponent(data.featuredCharityId)}`);
            if (charityRes.ok) {
              const charity = await charityRes.json();
              setFeaturedCharity(charity);
            }
          }
          if (data.activeEventId) {
            const eventRes = await fetch(`/api/events/list?creatorUserId=${encodeURIComponent(data._id)}&activeOnly=true`);
            if (eventRes.ok) {
              const eventData = await eventRes.json();
              const first = (eventData.results || []).find((ev: EventItem) => ev._id === data.activeEventId) || null;
              setActiveEvent(first);
            }
          }
        } catch {
          // ignore errors in auxiliary profile decorations
        }
        try {
          if (data?.address) {
            const riskRes = await fetch(`/api/wallet/risk?chain=ethereum&address=${encodeURIComponent(data.address)}`);
            if (riskRes.ok) {
              const risk = await riskRes.json();
              setRiskScore(typeof risk.score === 'number' ? risk.score : null);
              setRiskCategory(risk.category || null);
            }
          }
        } catch {
          // ignore risk fetch errors for now
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Resume any deferred action that required auth.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = consumeDeferredAction();
        if (!a) return;

        // Execute best-effort; failures should not block the profile.
        if (a.type === 'followWallet') {
          const resp = await fetch('/api/follow-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ chain: a.chain, address: a.address }),
          });
          if (!cancelled && resp.ok) setToast('Follow saved.');
          return;
        }

        if (a.type === 'flagWallet') {
          const resp = await fetch('/api/flags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ address: a.address, chain: a.chain, reason: a.reason, comment: a.comment }),
          });
          if (!cancelled && resp.ok) setToast('Flag submitted.');
          return;
        }

        if (a.type === 'rateWallet') {
          const resp = await fetch('/api/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ address: a.address, chain: a.chain, rating: a.rating, text: a.text || '' }),
          });
          if (!cancelled && resp.ok) setToast('Rating submitted.');
          return;
        }

        if (a.type === 'submitReport') {
          const resp = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ providerId: a.providerId || null, suspectAddress: a.suspectAddress, chain: a.chain, evidence: a.evidence || [] }),
          });
          if (!cancelled && resp.ok) setToast('Report submitted.');
          return;
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the local wallet address + inferred chain in sync with the shared wallet provider.
  useEffect(() => {
    if (!connectedWalletAddress) return;
    setWalletAddress(connectedWalletAddress);
  }, [connectedWalletAddress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected) return;
      const nextChain = await detectNftChain();
      if (!cancelled) setNftChain(nextChain);
    })();
    return () => {
      cancelled = true;
    };
  }, [evmProvider, isConnected]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/wallet/exchange-metadata');
        if (!res.ok) return;
        const data = await res.json();
        setMetadataOptions({
          exchanges: data.exchanges || [],
          coldWallets: data.coldWallets || [],
          softWallets: data.softWallets || [],
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  async function loadProfileEvents() {
    setError(null);
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/events/byUser', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEvents([]);
        setError((data as any)?.error || (data as any)?.message || 'Failed to load events');
        return;
      }
      const combined: EventItem[] = [...((data as any).active || []), ...((data as any).completed || [])];
      setEvents(combined);
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    void loadProfileEvents();
  }, [me?._id]);

  async function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const rawGoal = String(form.goalAmount || '').trim();
      const cleanedGoal = rawGoal.replace(/[^0-9.]/g, ''); // strip $, commas, spaces, etc.
      const numericGoal = Number(cleanedGoal);
      if (!Number.isFinite(numericGoal) || numericGoal <= 0) {
        setError('Goal amount must be a positive number');
        setCreating(false);
        return;
      }
      const payload = {
        title: form.title,
        description: form.description,
        goalAmount: numericGoal,
        deadline: form.deadline,
        recipientWallet: form.recipientWallet,
        givingBlockCharityId: form.givingBlockCharityId || undefined,
      };
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.message || 'Failed to create event');
        return;
      }
      setEvents((prev) => [data.event, ...prev]);
      setForm({ title: '', description: '', goalAmount: '', deadline: '', recipientWallet: '', givingBlockCharityId: '' });
    } catch (err) {
      setError((err as Error).message || 'Network error');
    } finally {
      setCreating(false);
    }
  }

  async function saveWalletMetadata(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.address) return;
    setSavingWalletMeta(true);
    try {
      const res = await fetch('/api/wallet/updateMetadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          chain: walletMeta.chain,
          exchangeSource: walletMeta.exchangeSource,
          storageType: walletMeta.storageType,
        }),
      });
      await res.json();
      // no-op on success; could show toast
    } catch {
      // ignore errors for now
    } finally {
      setSavingWalletMeta(false);
    }
  }

  async function handleConnectWallet() {
    setNftError(null);
    try {
      setConnectingWallet(true);
      // Connect via the shared provider (wagmi-backed). If no injected wallet exists,
      // fall back to /login where mobile deep links are available.
      try {
        await connectMetaMask();
      } catch (e: any) {
        const msg = String(e?.message || '');
        if (msg.toLowerCase().includes('not detected') || msg.toLowerCase().includes('provider')) {
          router.push('/login');
          return;
        }
        throw e;
      }

      const signer = await getSigner();
      const addr = await signer.getAddress();
      if (!addr) throw new Error('No wallet address returned.');
      setWalletAddress(addr);

      const chain = await detectNftChain();
      setNftChain(chain);

      setNftsLoading(true);
      setNftsError(null);
      try {
        const resp = await fetch(`/api/nfts/${encodeURIComponent(chain)}/${encodeURIComponent(addr)}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await resp.json().catch(() => ({} as any));
        if (!resp.ok) throw new Error(json?.message || 'Failed to load NFTs');
        const items = Array.isArray(json?.items) ? (json.items as UnifiedNftItem[]) : [];
        setNfts(items);
      } catch (err) {
        setNftsError((err as Error)?.message || 'Failed to load NFTs');
      } finally {
        setNftsLoading(false);
      }

      setToast(`Wallet connected (${chain})`);
    } catch (err: any) {
      const msg = (err && (err.message as string | undefined)) || '';
      const lower = msg.toLowerCase();
      if (lower.includes('user rejected') || lower.includes('rejected')) {
        setNftError('Connection request was cancelled in MetaMask.');
      } else {
        setNftError(msg || 'Failed to connect wallet');
      }
    } finally {
      setConnectingWallet(false);
    }
  }

  function handleSelectNft(item: UnifiedNftItem) {
    setNftError(null);
    if (!walletAddress) {
      setNftError('Connect your wallet first to link an NFT.');
      return;
    }
    if (!item.image) {
      setNftError('Selected NFT has no image.');
      return;
    }
    setNftImageUrl(item.image);
    setNftInput(item.image);
    setNftSource(item.source);
    fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ walletAddress: me?.address || walletAddress, nftAvatarUrl: item.image }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setNftError(data?.message || 'Failed to save NFT photo');
          return;
        }
        setToast('NFT photo linked to your profile');
      })
      .catch(() => {
        setNftError('Network error while saving NFT photo');
      });
  }

  function handleApplyNft() {
    setNftError(null);
    if (!walletAddress) {
      setNftError('Connect your wallet first to link an NFT.');
      return;
    }
    if (!nftInput.trim()) {
      setNftError('Paste an NFT image URL to continue.');
      return;
    }
    const url = nftInput.trim();
    setNftImageUrl(url);
    setNftSource('custom');
    // Persist to profile
    fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ walletAddress: me?.address || walletAddress, nftAvatarUrl: url }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setNftError(data?.message || 'Failed to save NFT photo');
          return;
        }
        setToast('NFT photo linked to your profile');
      })
      .catch(() => {
        setNftError('Network error while saving NFT photo');
      });
  }

  function handleCopyLink(url: string) {
    try {
      navigator.clipboard.writeText(url);
      setToast('Link copied to clipboard');
    } catch {
      setToast('Copied (fallback)');
    }
  }

  const now = new Date();

  function formatDeadline(deadlineIso?: string) {
    if (!deadlineIso) return 'No deadline';
    try {
      const d = new Date(deadlineIso);
      const diffMs = d.getTime() - Date.now();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (days > 1) return `in ${days} days`;
      if (days === 1) return 'tomorrow';
      if (days === 0) return 'today';
      // past
      return `ended ${Math.abs(days)} days ago`;
    } catch {
      return deadlineIso;
    }
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold leading-tight" style={{ color: '#fefce8' }}>Profile</h1>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Your on-chain identity, charity presets, and live events.</p>
          </div>
          {me?.address ? (
            <div className="hidden sm:flex items-center">
              <UserProfile walletAddress={me.address} />
            </div>
          ) : null}
          <Link
            href="/profile/edit"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_30px_rgba(34,197,94,0.45)] hover:from-emerald-400 hover:to-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/20 text-[10px]">✎</span>
            Edit profile
          </Link>
        </div>

        {safeRedirectTo ? (
          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-slate-100 font-semibold">You’re signed in.</div>
              <div className="text-xs text-slate-300 mt-1">You can return to where you left off anytime.</div>
            </div>
            <a
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-100 hover:bg-slate-700"
              href={safeRedirectTo}
            >
              Return
            </a>
          </div>
        ) : null}
        <div className="mb-4 flex gap-2 border-b border-slate-800/80 pb-2" role="tablist" aria-label="Profile tabs">
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${tab === 'profile' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-emerald-300'}`}
            onClick={() => setTab('profile')}
            aria-selected={tab === 'profile'}
          >
            Overview
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${tab === 'events' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-emerald-300'}`}
            onClick={() => setTab('events')}
            aria-selected={tab === 'events'}
          >
            Charity Events
          </button>
          <Link
            href="/profile/edit"
            className="ml-auto inline-flex sm:hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_10px_26px_rgba(34,197,94,0.5)] hover:from-emerald-400 hover:to-lime-300"
          >
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900/20 text-[9px]">✎</span>
            Edit
          </Link>
        </div>

        {tab === 'profile' && (
          <div className="space-y-6 text-slate-200">
            <section
              className="relative overflow-hidden rounded-[1.75rem] border border-emerald-500/40 bg-black/90"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.45) 0, rgba(15,23,42,0.65) 40%, rgba(2,6,23,0.98) 70%, #020617 100%), radial-gradient(circle at 100% 120%, rgba(250,204,21,0.22) 0, transparent 55%)',
                boxShadow: '0 26px 72px rgba(0,0,0,0.96)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none" style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 0%, rgba(74,222,128,0.55) 0, transparent 55%), radial-gradient(circle at 80% 120%, rgba(250,204,21,0.45) 0, transparent 60%)',
              }} />

              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-6 px-6 py-6 md:px-8 md:py-7">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-1.5" style={{ color: '#facc15' }}>
                    On-chain identity
                  </p>
                  <div className="mb-2">
                    <KYCRequestButton />
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 leading-tight" style={{ color: '#fefce8' }}>
                    Link your NFT as your profile photo
                  </h2>
                  <p className="text-xs md:text-sm max-w-md" style={{ color: '#fef9c3' }}>
                    Connect MetaMask, paste your NFT image URL, and showcase a verifiable, on-chain identity photo across your charity activity.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleConnectWallet}
                      className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-xs md:text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      {connectingWallet ? 'Connecting…' : walletAddress ? 'Wallet connected' : 'Connect MetaMask'}
                    </button>
                    {walletAddress && (
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-black/40 border border-emerald-400/40" style={{ color: '#fef9c3' }}>
                        {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                      </span>
                    )}
                    {walletAddress && (
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-black/40 border border-emerald-400/40" style={{ color: '#bbf7d0' }}>
                        Network: {String(nftChain || 'ethereum')}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 w-full max-w-md">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#fef9c3' }}>
                      NFT image URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={nftInput}
                        onChange={(e) => setNftInput(e.target.value)}
                        placeholder="Paste image URL from your NFT metadata"
                        className="flex-1 rounded-full bg-black/50 px-4 py-2 text-xs md:text-sm placeholder:text-amber-200/60 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                        style={{ color: '#fefce8' }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyNft}
                        className="inline-flex items-center justify-center rounded-full border border-amber-300/60 px-4 py-2 text-xs md:text-sm font-semibold bg-amber-400/10 hover:bg-amber-400/20"
                        style={{ color: '#fef9c3' }}
                      >
                        Link NFT photo
                      </button>
                    </div>
                    {nftError && (
                      <p className="mt-1 text-[11px]" style={{ color: '#fecaca' }}>{nftError}</p>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-64 flex-shrink-0">
                  <div
                    className="relative rounded-[1.4rem] overflow-hidden border border-emerald-400/40 bg-black/70"
                    style={{ boxShadow: '0 18px 40px rgba(0,0,0,0.9)' }}
                  >
                    <div className="aspect-[4/5] flex items-center justify-center bg-gradient-to-b from-emerald-500/20 via-emerald-900/50 to-black">
                      {nftImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={nftImageUrl}
                          alt="Linked NFT avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center px-4 text-center">
                          <span className="text-4xl mb-2" role="img" aria-label="profile camera">
                            📸
                          </span>
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: '#fef9c3' }}>
                            Your NFT photo
                          </p>
                          <p className="mt-1 text-[11px]" style={{ color: '#fef3c7' }}>
                            Once linked, your NFT image will appear here as your on-chain identity avatar.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between text-[11px] border-t border-emerald-400/30" style={{ background: 'linear-gradient(to right, rgba(21,128,61,0.25), rgba(190,242,100,0.22))' }}>
                      <span className="font-semibold" style={{ color: '#fefce8' }}>
                        Profile NFT
                      </span>
                      <div className="flex items-center gap-1.5">
                        {nftSource && (
                          <span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] bg-black/40 border border-emerald-300/60" style={{ color: '#bbf7d0' }}>
                            {nftSource === 'opensea' && 'OPENSEA'}
                            {nftSource === 'rarible' && 'RARIBLE'}
                            {nftSource === 'ud' && 'UD.ME'}
                            {nftSource === 'custom' && 'CUSTOM URL'}
                          </span>
                        )}
                        <span className="uppercase tracking-[0.16em]" style={{ color: '#facc15' }}>
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* NFT gallery from connected wallet */}
            {walletAddress && (
              <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold" style={{ color: '#fefce8' }}>
                    Your NFTs <span className="text-xs text-slate-400">({String(nftChain || 'ethereum')})</span>
                  </h2>
                  {nftsLoading && (
                    <span className="text-[11px]" style={{ color: '#e5e7eb' }}>Loading NFTs…</span>
                  )}
                </div>
                {nftsError && (
                  <p className="text-[11px] mb-2" style={{ color: '#fecaca' }}>{nftsError}</p>
                )}
                {!nftsLoading && !nftsError && nfts.length === 0 && (
                  <p className="text-[11px]" style={{ color: '#9ca3af' }}>
                    No NFTs detected yet from OpenSea, Rarible, or UD for this wallet.
                  </p>
                )}
                {nfts.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {nfts.map((item) => (
                      <button
                        key={`${item.source}-${item.contractAddress}-${item.tokenId}`}
                        type="button"
                        onClick={() => handleSelectNft(item)}
                        className="group relative overflow-hidden rounded-xl border border-slate-700/80 bg-black/60 shadow-sm hover:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-28 w-full object-cover group-hover:opacity-95"
                        />
                        <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px]" style={{ color: '#e5e7eb', background: 'linear-gradient(to right, rgba(15,23,42,0.96), rgba(15,23,42,0.9))' }}>
                          <span className="truncate mr-1">{item.name}</span>
                          <span className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] bg-slate-800/80">
                            {item.source}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Address:</span>
                {' '}
                {me ? <span className="break-all">{me.address}</span> : <Skeleton className="h-4 w-48" />}
              </div>
              <div>
                <span className="font-semibold">Display name:</span>
                {' '}
                {me ? (me.displayName || '—') : <Skeleton className="h-4 w-32" />}
              </div>
              <div>
                <span className="font-semibold">ENS / Base name:</span>
                {' '}
                {me ? (me.primaryName || me.ensName || me.baseName || '—') : <Skeleton className="h-4 w-40" />}
              </div>
              <div>
                <span className="font-semibold">UD:</span>
                {' '}
                {me ? (me.udDomain || '—') : <Skeleton className="h-4 w-40" />}
              </div>
              <div>
                <span className="font-semibold">Phone Book:</span>
                {' '}
                {me ? (
                  me.directoryOptIn ? (
                    <span className="text-slate-100">Listed · <Link className="underline text-slate-200 hover:text-slate-100" href="/phone-book">View directory</Link></span>
                  ) : (
                    <span className="text-slate-400">Not listed</span>
                  )
                ) : (
                  <Skeleton className="h-4 w-32" />
                )}
              </div>
              <div>
                <span className="font-semibold">Trust score:</span>
                {' '}
                {me ? `${me.socialLinks?.trustScore ?? 0} / 100` : <Skeleton className="h-4 w-24" />}
              </div>
              <div>
                <span className="font-semibold">Reputation:</span>
                {' '}
                {me?.reputation?.score != null ? (
                  <span title={me?.reputation?.tooltip || ''} className="text-slate-100">
                    {me.reputation.score} / 100 ({me.reputation.label})
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Connected chains:</span>
                {' '}
                {me ? (
                  <span className="text-slate-100">{(me.connectedChains || []).length ? (me.connectedChains || []).join(', ') : '—'}</span>
                ) : (
                  <Skeleton className="h-4 w-40" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold">Wallet risk:</span>
                {riskScore !== null ? (
                  <RiskBadge score={riskScore} category={riskCategory || undefined} />
                ) : (
                  <span className="text-xs text-slate-400">Loading…</span>
                )}
              </div>
              {me?.activity && me.activity.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold">Recent activity:</div>
                  <ul className="mt-1 space-y-1 text-sm text-slate-200">
                    {me.activity.slice(0, 5).map((a, idx) => (
                      <li key={`${a.type}-${idx}`} className="text-slate-300">
                        {a.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {featuredCharity && (
              <div
                className="rounded-[1.4rem] p-4 md:p-5 border"
                style={{
                  background:
                    'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.12), transparent 55%), radial-gradient(circle at 100% 120%, rgba(56,189,248,0.14), transparent 60%), rgba(15,23,42,0.96)',
                  borderColor: 'rgba(15,23,42,0.9)',
                  boxShadow: '0 18px 48px rgba(0,0,0,0.9)',
                }}
              >
                <h2 className="font-semibold text-sm mb-1.5" style={{ color: '#fefce8' }}>Featured charity</h2>
                <p className="text-[11px] mb-3" style={{ color: '#9ca3af' }}>
                  This organization will be promoted across your profile and donation widgets.
                </p>
                <div className="flex items-start gap-3">
                  {featuredCharity.logo && (
                    featuredCharity.logo.startsWith('/') ? (
                      <Image src={featuredCharity.logo} alt={featuredCharity.name} width={48} height={48} className="rounded object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={featuredCharity.logo} alt={featuredCharity.name} className="w-12 h-12 rounded object-cover" />
                    )
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: '#e5e7eb' }}>{featuredCharity.name}</div>
                    {featuredCharity.description && (
                      <p className="text-xs mt-1 line-clamp-3" style={{ color: '#cbd5f5', wordBreak: 'break-word' as React.CSSProperties['wordBreak'], overflowWrap: 'anywhere' as React.CSSProperties['overflowWrap'] }}>{featuredCharity.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {me?.donationLink && (
                        <a
                          href={me.donationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 text-xs rounded-full bg-emerald-500 text-slate-950 font-semibold shadow-sm hover:bg-emerald-400"
                        >
                          Donate via link
                        </a>
                      )}
                      {me?.donationWidgetEmbed?.widgetId && (
                        <Link
                          href={`/embed/giving-block/${encodeURIComponent(me.donationWidgetEmbed.widgetId)}?charityId=${encodeURIComponent(me.donationWidgetEmbed.charityId || featuredCharity.charityId || '')}`}
                          className="px-3.5 py-1.5 text-xs rounded-full bg-slate-900/70 text-cyan-200 border border-cyan-500/40 hover:bg-slate-800/90"
                        >
                          Open donation widget
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!featuredCharity && me === null && (
              <div className="bg-slate-900 p-4 rounded border border-slate-800">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              </div>
            )}
            {activeEvent && (
              <div className="bg-slate-900 p-4 rounded border border-slate-800">
                <h2 className="font-semibold text-sm mb-2">Active event</h2>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-medium text-slate-100 text-sm">{activeEvent.title}</div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3">{activeEvent.description}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Live</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300 mt-2">
                  <span>Goal: {activeEvent.goalAmount}</span>
                  <span>Recipient: {activeEvent.recipientWallet}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/events/${activeEvent._id}`}
                    className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    View event
                  </Link>
                  {me?.donationLink && (
                    <a
                      href={me.donationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs rounded bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700"
                    >
                      Donate via link
                    </a>
                  )}
                </div>
              </div>
            )}
            <form onSubmit={saveWalletMetadata} className="bg-slate-900 p-4 rounded border border-slate-800 space-y-3" aria-label="Wallet exchange and storage form">
              <h2 className="font-semibold text-sm">Wallet Exchange & Storage</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label htmlFor="chain" className="block text-xs mb-1 text-slate-300">Chain</label>
                  <select
                    id="chain"
                    className="w-full px-3 py-2 bg-gray-800 rounded text-white text-sm"
                    value={walletMeta.chain}
                    onChange={(e) => setWalletMeta({ ...walletMeta, chain: e.target.value })}
                  >
                    <option value="eth">Ethereum</option>
                    <option value="btc">Bitcoin</option>
                    <option value="sol">Solana</option>
                    <option value="tron">Tron</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label htmlFor="exchange" className="block text-xs mb-1 text-slate-300">Exchange used</label>
                  <select
                    id="exchange"
                    className="w-full px-3 py-2 bg-gray-800 rounded text-white text-sm"
                    value={walletMeta.exchangeSource}
                    onChange={(e) => setWalletMeta({ ...walletMeta, exchangeSource: e.target.value })}
                  >
                    <option value="">Select exchange</option>
                    {metadataOptions.exchanges.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label htmlFor="storage" className="block text-xs mb-1 text-slate-300">Wallet type/brand</label>
                  <select
                    id="storage"
                    className="w-full px-3 py-2 bg-gray-800 rounded text-white text-sm"
                    value={walletMeta.storageType}
                    onChange={(e) => setWalletMeta({ ...walletMeta, storageType: e.target.value })}
                  >
                    <option value="">Select wallet</option>
                    {metadataOptions.coldWallets.map((w) => (
                      <option key={w} value={`cold:${w}`}>Cold - {w}</option>
                    ))}
                    {metadataOptions.softWallets.map((w) => (
                      <option key={w} value={`soft:${w}`}>Soft - {w}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={savingWalletMeta}
                className="px-4 py-2 bg-emerald-600 rounded text-white text-sm"
              >
                {savingWalletMeta ? 'Saving...' : 'Save wallet metadata'}
              </button>
            </form>
          </div>
        )}

        {tab === 'events' && (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start" style={{ alignItems: 'flex-start' }}>
            <form
              onSubmit={submitEvent}
              className="rounded-[1.5rem] p-6"
              style={{
                background:
                  'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.12), transparent 55%), radial-gradient(circle at 100% 120%, rgba(56,189,248,0.14), transparent 60%), rgba(0,0,0,0.9)',
                boxShadow: '0 22px 64px rgba(0,0,0,0.95)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(15,23,42,0.9)',
                maxWidth: '34rem',
                width: '100%',
                margin: '0 auto',
              }}
            >
              <h2 className="font-semibold mb-1 text-lg" style={{ color: '#fefce8' }}>Create charity event</h2>
              <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>
                Launch a transparent on-chain fundraiser with a clear goal, deadline, and recipient wallet.
              </p>
              <div className="space-y-3">
                <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Title</label>
                <input
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm md:text-base placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="Short descriptive title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />

                <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Description</label>
                <textarea
                  className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="What is the event for?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Goal amount</label>
                    <input
                      type="text"
                      className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="Goal amount (e.g. 100 or $100)"
                      value={form.goalAmount}
                      onChange={(e) => setForm({ ...form, goalAmount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Deadline</label>
                    <input
                      type="date"
                      className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Recipient wallet</label>
                    <input
                      className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="0xabc..."
                      value={form.recipientWallet}
                      onChange={(e) => setForm({ ...form, recipientWallet: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Giving Block charity ID (optional)</label>
                <input
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  placeholder="Optional Giving Block charity ID"
                  value={form.givingBlockCharityId}
                  onChange={(e) => setForm({ ...form, givingBlockCharityId: e.target.value })}
                />

                {error && <div className="text-sm text-red-400">{error}</div>}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm md:text-base font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {creating ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-3" style={{ maxWidth: '30rem', width: '100%', margin: '0 auto' }}>
              <h2 className="font-semibold mb-1 text-sm tracking-[0.14em] uppercase" style={{ color: '#facc15' }}>Your charity events</h2>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Track live and completed campaigns linked to your profile.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={loadProfileEvents}
                  disabled={loadingEvents}
                  className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loadingEvents ? 'Loading events…' : 'Show events'}
                </button>
              </div>
              {loadingEvents ? (
                <div className="text-sm" style={{ color: '#e5e7eb' }}>Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-slate-400 text-sm rounded-xl border border-dashed border-slate-700 px-3 py-3">
                  No events yet. Once you create a charity event, it will appear here.
                </div>
              ) : (
                <ul className="space-y-3">
                  {events.map((ev) => {
                    const deadlineDate = new Date(ev.deadline);
                    const diffMs = deadlineDate.getTime() - now.getTime();
                    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    const active = diffMs > 0;
                    return (
                      <li
                        key={ev._id}
                        className="rounded-xl p-3"
                        style={{
                          background:
                            'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.09), transparent 55%), rgba(15,23,42,0.96)',
                          border: '1px solid rgba(30,64,175,0.55)',
                        }}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="font-semibold text-sm" style={{ color: '#e5e7eb' }}>{ev.title}</h3>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40' : 'bg-slate-700/60 text-slate-100 border border-slate-600'
                            }`}
                          >
                            {active ? formatDeadline(ev.deadline) : `Completed (${formatDeadline(ev.deadline)})`}
                          </span>
                        </div>
                        <p className="text-xs mb-1 line-clamp-3" style={{ color: '#cbd5f5' }}>{ev.description}</p>
                        <div className="flex items-center justify-between text-[11px] mb-1" style={{ color: '#9ca3af' }}>
                          <span>Goal: {ev.goalAmount}</span>
                          <span className="truncate max-w-[55%]">Recipient: {ev.recipientWallet}</span>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-[11px]">
                          <Link
                            href={`/events/${ev._id}`}
                            className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                          >
                            Show event
                          </Link>
                          <button
                            type="button"
                            className="text-xs text-amber-200 hover:text-amber-100 underline"
                            onClick={() => handleCopyLink(`${window.location.origin}/events/${ev._id}`)}
                          >
                            Copy share link
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

    function KYCRequestButton() {
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<string | null>(null);
      return (
        <span className="inline-block">
          <button
            className="ml-4 px-3 py-1 rounded bg-cyan-700 text-white font-bold disabled:opacity-60"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await fetch('/api/kyc-request', { method: 'POST', credentials: 'include' });
                const result = await res.json().catch(() => ({}));
                if ((result as any).kycUrl) {
                  window.open((result as any).kycUrl, '_blank');
                } else {
                  setError((result as any).message || 'KYC request failed');
                }
              } catch {
                setError('Network error');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Requesting...' : 'Request KYC'}
          </button>
          {error && <span className="ml-2 text-red-400 text-xs">{error}</span>}
        </span>
      );
    }
