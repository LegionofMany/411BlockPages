"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
  displayName?: string;
  socialLinks?: {
    trustScore?: number;
  };
  featuredCharityId?: string;
  activeEventId?: string;
  donationLink?: string;
  donationWidgetEmbed?: {
    widgetId?: string;
    charityId?: string;
  };
}

export default function ProfilePage() {
  const [tab, setTab] = useState<'profile' | 'events'>('events');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [featuredCharity, setFeaturedCharity] = useState<any | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [walletMeta, setWalletMeta] = useState({ chain: 'eth', exchangeSource: '', storageType: '' });
  const [metadataOptions, setMetadataOptions] = useState<{ exchanges: string[]; coldWallets: string[]; softWallets: string[] }>({ exchanges: [], coldWallets: [], softWallets: [] });
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setMe(data);
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
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  useEffect(() => {
    if (!me?._id) return;
    setLoadingEvents(true);
    (async () => {
      try {
        const res = await fetch(`/api/events/byUser/${me._id}`);
        if (!res.ok) return;
        const data = await res.json();
        const combined: EventItem[] = [...(data.active || []), ...(data.completed || [])];
        setEvents(combined);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [me?._id]);

  async function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        goalAmount: Number(form.goalAmount),
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

  const now = new Date();

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="mb-4 flex gap-2 border-b border-slate-700 pb-2">
          <button
            className={`px-3 py-1 rounded ${tab === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-300'}`}
            onClick={() => setTab('profile')}
          >
            Overview
          </button>
          <button
            className={`px-3 py-1 rounded ${tab === 'events' ? 'bg-slate-800 text-white' : 'text-slate-300'}`}
            onClick={() => setTab('events')}
          >
            Charity Events
          </button>
          <Link href="/profile/edit" className="ml-auto text-sm text-cyan-300 hover:underline">Edit profile</Link>
        </div>

        {tab === 'profile' && (
          <div className="space-y-4 text-slate-200">
            <div className="space-y-2">
              <div><span className="font-semibold">Address:</span> {me?.address}</div>
              <div><span className="font-semibold">Display name:</span> {me?.displayName || '—'}</div>
              <div><span className="font-semibold">Trust score:</span> {me?.socialLinks?.trustScore ?? 0} / 100</div>
            </div>
            {featuredCharity && (
              <div className="bg-slate-900 p-4 rounded border border-slate-800">
                <h2 className="font-semibold text-sm mb-2">Featured charity</h2>
                <div className="flex items-start gap-3">
                  {featuredCharity.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featuredCharity.logo} alt={featuredCharity.name} className="w-12 h-12 rounded object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-slate-100">{featuredCharity.name}</div>
                    {featuredCharity.description && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-3">{featuredCharity.description}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {me?.donationLink && (
                        <a
                          href={me.donationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          Donate via link
                        </a>
                      )}
                      {me?.donationWidgetEmbed?.widgetId && (
                        <Link
                          href={`/embed/giving-block/${encodeURIComponent(me.donationWidgetEmbed.widgetId)}?charityId=${encodeURIComponent(me.donationWidgetEmbed.charityId || featuredCharity.charityId || '')}`}
                          className="px-3 py-1.5 text-xs rounded bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700"
                        >
                          Open donation widget
                        </Link>
                      )}
                    </div>
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
            <form onSubmit={saveWalletMetadata} className="bg-slate-900 p-4 rounded border border-slate-800 space-y-3">
              <h2 className="font-semibold text-sm">Wallet Exchange & Storage</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="block text-xs mb-1 text-slate-300">Chain</label>
                  <select
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
                  <label className="block text-xs mb-1 text-slate-300">Exchange used</label>
                  <select
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
                  <label className="block text-xs mb-1 text-slate-300">Wallet type/brand</label>
                  <select
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
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={submitEvent} className="bg-slate-900 p-4 rounded border border-slate-800 space-y-3">
              <h2 className="font-semibold mb-1">Create Charity Event</h2>
              <input
                className="w-full px-3 py-2 bg-gray-800 rounded text-white"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="w-full px-3 py-2 bg-gray-800 rounded text-white"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-800 rounded text-white"
                placeholder="Goal amount"
                min="0"
                step="0.00000001"
                value={form.goalAmount}
                onChange={(e) => setForm({ ...form, goalAmount: e.target.value })}
                required
              />
              <input
                type="date"
                className="w-full px-3 py-2 bg-gray-800 rounded text-white"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 bg-gray-800 rounded text-white"
                placeholder="Recipient wallet"
                value={form.recipientWallet}
                onChange={(e) => setForm({ ...form, recipientWallet: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 bg-gray-800 rounded text-white"
                placeholder="Optional Giving Block charity ID"
                value={form.givingBlockCharityId}
                onChange={(e) => setForm({ ...form, givingBlockCharityId: e.target.value })}
              />
              {error && <div className="text-sm text-red-400">{error}</div>}
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-emerald-600 rounded text-white"
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </form>

            <div className="space-y-3">
              <h2 className="font-semibold mb-1">Your Events</h2>
              {loadingEvents ? (
                <div>Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-slate-400 text-sm">No events yet.</div>
              ) : (
                <ul className="space-y-3">
                  {events.map((ev) => {
                    const deadlineDate = new Date(ev.deadline);
                    const diffMs = deadlineDate.getTime() - now.getTime();
                    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    const active = diffMs > 0;
                    return (
                      <li key={ev._id} className="border border-slate-800 rounded p-3 bg-slate-900">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-sm">{ev.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/40 text-slate-200'}`}>
                            {active ? `${daysLeft} days left` : 'Completed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-1 line-clamp-3">{ev.description}</p>
                        <div className="text-[11px] text-slate-400 mb-1">Goal: {ev.goalAmount}</div>
                        <div className="text-[11px] text-slate-400 truncate">Recipient: {ev.recipientWallet}</div>
                        <div className="mt-2 flex justify-between items-center text-[11px] text-cyan-300">
                          <Link href={`/events/${ev._id}`}>Open event page</Link>
                          <button
                            type="button"
                            className="text-xs underline"
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/events/${ev._id}`)}
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
    </div>
  );
}
