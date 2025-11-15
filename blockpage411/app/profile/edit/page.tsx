"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../components/simpleToast';

type ProfileState = Record<string, string | boolean | undefined>;

interface CharityOption {
  charityId: string;
  name: string;
}

interface EventOption {
  _id: string;
  title: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<ProfileState>({ displayName: '', avatarUrl: '', bio: '', telegram: '', twitter: '', discord: '', website: '', phoneApps: '' });
  const [charities, setCharities] = useState<CharityOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          setError('Failed to fetch profile');
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setValues({
          displayName: data.displayName || '',
          avatarUrl: data.avatarUrl || '',
          bio: data.bio || '',
          telegram: data.telegram || '',
          twitter: data.twitter || '',
          discord: data.discord || '',
          website: data.website || '',
          phoneApps: (data.phoneApps || []).join(', '),
          facebook: data.socialLinks?.facebook || '',
          instagram: data.socialLinks?.instagram || '',
          whatsapp: data.socialLinks?.whatsapp || '',
          featuredCharityId: data.featuredCharityId || '',
          activeEventId: data.activeEventId || '',
          donationLink: data.donationLink || '',
          donationWidgetEnabled: Boolean(data.donationWidgetEmbed && (data.donationWidgetEmbed.widgetId || data.donationWidgetEmbed.charityId)),
        });

        try {
          const [charityRes, eventsRes] = await Promise.all([
            fetch('/api/charities/list', { credentials: 'include' }),
            fetch('/api/events/byUser', { credentials: 'include' }),
          ]);
          if (charityRes.ok) {
            const list = await charityRes.json();
            if (Array.isArray(list)) {
              setCharities(list.map((c: any) => ({ charityId: c.charityId || c.givingBlockId || '', name: c.name || c.charityId || 'Unnamed charity' })).filter((c: CharityOption) => c.charityId));
            }
          }
          if (eventsRes.ok) {
            const list = await eventsRes.json();
            if (Array.isArray(list)) {
              setEvents(list.map((e: any) => ({ _id: e._id, title: e.title || 'Untitled event' })).filter((e: EventOption) => e._id));
            }
          }
        } catch {
          // ignore auxiliary fetch errors; core profile still loads
        }
      } catch (e) {
        setError((e as Error).message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        displayName: values.displayName,
        avatarUrl: values.avatarUrl,
        bio: values.bio,
        telegram: values.telegram,
        twitter: values.twitter,
        discord: values.discord,
        website: values.website,
        phoneApps: values.phoneApps ? String(values.phoneApps).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        featuredCharityId: values.featuredCharityId || '',
        activeEventId: values.activeEventId || '',
        donationLink: values.donationLink || '',
        donationWidgetEmbed: values.donationWidgetEnabled
          ? {
              widgetId: values.featuredCharityId ? String(values.featuredCharityId) : undefined,
              charityId: values.featuredCharityId ? String(values.featuredCharityId) : undefined,
            }
          : undefined,
      };
      const res = await fetch('/api/me.patch', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to save');
        return;
      }
      router.push('/');
    } catch (e) {
      setError((e as Error).message || 'Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto p-6 pt-6">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-cyan-300 hover:underline">← Back</button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
        {loading ? <div>Loading...</div> : (
          <form onSubmit={save} className="space-y-6 bg-slate-900 p-6 rounded-lg border border-slate-800">
            <input value={String(values.displayName ?? '')} onChange={e=>setValues({...values, displayName: e.target.value})} placeholder="Display name" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <input value={String(values.avatarUrl ?? '')} onChange={e=>setValues({...values, avatarUrl: e.target.value})} placeholder="Avatar URL" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <textarea value={String(values.bio ?? '')} onChange={e=>setValues({...values, bio: e.target.value})} placeholder="Bio" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <div>
              <div className="flex gap-2 items-center">
                <input value={String(values.telegram ?? '')} onChange={e=>setValues({...values, telegram: e.target.value})} placeholder="Telegram handle" className="flex-1 px-3 py-2 bg-gray-800 rounded text-white" />
                <div className="text-sm text-slate-300">{values.telegram ? (values.telegramVerified ? <span className="text-emerald-300">Verified</span> : <span className="text-amber-300">Unverified</span>) : null}</div>
                <button type="button" className="px-3 py-2 bg-blue-600 rounded" onClick={async ()=>{ await requestSocialVerify('telegram', String(values.telegram||''), setValues); }}>Request Verify</button>
                {String(values['__telegramCode'] ?? '') ? (
                  <button type="button" className="px-3 py-2 bg-gray-600 rounded" onClick={async ()=>{ try { await navigator.clipboard.writeText(String(values['__telegramCode'])); showToast('Code copied to clipboard', 2000); } catch {} }}>
                    Copy Code
                  </button>
                ) : null}
                <button type="button" className="px-3 py-2 bg-emerald-600 rounded" onClick={async ()=>{ await confirmSocialVerify('telegram', String(values.telegram||''), setValues); }}>Check Verification</button>
              </div>
              {values.__telegramMsg ? <div className="text-sm text-slate-300 mt-1">{values.__telegramMsg}</div> : null}
            </div>
            <div className="mt-2">
              <div className="flex gap-2 items-center">
                <input value={String(values.twitter ?? '')} onChange={e=>setValues({...values, twitter: e.target.value})} placeholder="Twitter handle" className="flex-1 px-3 py-2 bg-gray-800 rounded text-white" />
                <div className="text-sm text-slate-300">{values.twitter ? (values.twitterVerified ? <span className="text-emerald-300">Verified</span> : <span className="text-amber-300">Unverified</span>) : null}</div>
                <button type="button" className="px-3 py-2 bg-blue-600 rounded" onClick={async ()=>{ await requestSocialVerify('twitter', String(values.twitter||''), setValues); }}>Request Verify</button>
                {String(values['__twitterCode'] ?? '') ? (
                  <button type="button" className="px-3 py-2 bg-gray-600 rounded" onClick={async ()=>{ try { await navigator.clipboard.writeText(String(values['__twitterCode'])); showToast('Code copied to clipboard', 2000); } catch {} }}>
                    Copy Code
                  </button>
                ) : null}
                <button type="button" className="px-3 py-2 bg-emerald-600 rounded" onClick={async ()=>{ await confirmSocialVerify('twitter', String(values.twitter||''), setValues); }}>Check Verification</button>
              </div>
              {values.__twitterMsg ? <div className="text-sm text-slate-300 mt-1">{values.__twitterMsg}</div> : null}
            </div>
            <input value={String(values.discord ?? '')} onChange={e=>setValues({...values, discord: e.target.value})} placeholder="Discord" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <input value={String(values.website ?? '')} onChange={e=>setValues({...values, website: e.target.value})} placeholder="Website" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <input value={String(values.facebook ?? '')} onChange={e=>setValues({...values, facebook: e.target.value})} placeholder="Facebook" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <input value={String(values.instagram ?? '')} onChange={e=>setValues({...values, instagram: e.target.value})} placeholder="Instagram" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <input value={String(values.whatsapp ?? '')} onChange={e=>setValues({...values, whatsapp: e.target.value})} placeholder="WhatsApp" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />
            <input value={String(values.phoneApps ?? '')} onChange={e=>setValues({...values, phoneApps: e.target.value})} placeholder="Phone apps (comma separated) e.g. WhatsApp, Signal" className="w-full px-3 py-2 bg-gray-800 rounded text-white" />

            <div className="pt-4 border-t border-slate-800 mt-4">
              <h2 className="text-lg font-semibold mb-3 text-slate-100">Charity presets</h2>
              <p className="text-sm text-slate-300 mb-4">
                Highlight a featured charity and active event on your profile. These settings power your default donation call-to-action.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Featured charity</label>
                  <select
                    value={String(values.featuredCharityId ?? '')}
                    onChange={e => setValues({ ...values, featuredCharityId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 rounded text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None</option>
                    {charities.map(c => (
                      <option key={c.charityId} value={c.charityId}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">This charity will be promoted by default on your profile.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Active event</label>
                  <select
                    value={String(values.activeEventId ?? '')}
                    onChange={e => setValues({ ...values, activeEventId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 rounded text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None</option>
                    {events.map(e => (
                      <option key={e._id} value={e._id}>{e.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Pick a live campaign or event you want visitors to see first.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Donation link (optional)</label>
                  <input
                    value={String(values.donationLink ?? '')}
                    onChange={e => setValues({ ...values, donationLink: e.target.value })}
                    placeholder="https://your-donation-page.example"
                    className="w-full px-3 py-2 bg-gray-800 rounded text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Must be an https URL. Used as a primary donation button if set.</p>
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-100">Show Giving Block widget</div>
                    <p className="text-xs text-slate-400">Embed a secure donation widget for your featured charity.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValues({ ...values, donationWidgetEnabled: !values.donationWidgetEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.donationWidgetEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${values.donationWidgetEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
            {error && <div className="text-red-400">{error}</div>}
            <div className="flex gap-2">
              <button disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={()=>router.push('/')} className="px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

async function requestSocialVerify(
  platform: string,
  handle: string,
  setValues: React.Dispatch<React.SetStateAction<ProfileState>>
) {
  if (!handle) { showToast('Please enter a handle first', 3000); return; }
  try {
    const res = await fetch('/api/verify/social/request', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handle }) });
    const data = await res.json();
    if (!res.ok) { showToast(data?.message || 'Request failed', 4000); return; }
    showToast(`Verification requested. Check instructions.`, 5000);
    // save code to state for explicit copying
    const code = String(data?.code ?? '');
    if (code) {
      setValues((prev: ProfileState) => ({ ...prev, [`__${platform}Code`]: code }));
      try {
        await navigator.clipboard.writeText(code);
        showToast('Verification code copied to clipboard', 3000);
      } catch {
        // ignore clipboard errors
      }
    }
  } catch {
    showToast('Network error', 3000);
  }
}

async function confirmSocialVerify(
  platform: string,
  handle: string,
  setValues: React.Dispatch<React.SetStateAction<ProfileState>>
) {
  if (!handle) { showToast('Please enter a handle first', 3000); return; }
  const maxAttempts = 5;
  let attempt = 0;
  let delay = 1000;
  setValues((prev: ProfileState) => ({ ...prev, [`__${platform}Msg`]: `Checking verification...` }));
  while (attempt < maxAttempts) {
    try {
      const res = await fetch('/api/verify/social/confirm', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handle }) });
      const data = await res.json();
      if (res.ok) {
        showToast(`${platform} verified successfully`, 3000);
        // update local state and then refresh profile from server
        setValues((prev: ProfileState) => ({ ...prev, [platform]: handle, [`${platform}Verified`]: true, [`__${platform}Msg`]: 'Verified' }));
        try {
          const meRes = await fetch('/api/me', { credentials: 'include' });
          if (meRes.ok) {
            const me = await meRes.json();
            setValues((prev: ProfileState) => ({
              ...prev,
              displayName: me.displayName || '',
              avatarUrl: me.avatarUrl || '',
              bio: me.bio || '',
              telegram: me.telegram || '',
              twitter: me.twitter || '',
              discord: me.discord || '',
              website: me.website || '',
              phoneApps: (me.phoneApps || []).join(', '),
              [`${platform}Verified`]: true,
              [`__${platform}Msg`]: 'Verified'
            }));
          }
        } catch {
          // ignore refresh errors; local state already updated
        }
        return;
      } else {
        setValues((prev: ProfileState) => ({ ...prev, [`__${platform}Msg`]: `${data?.message || 'Not verified yet'} (attempt ${attempt+1})` }));
      }
    } catch {
      setValues((prev: ProfileState) => ({ ...prev, [`__${platform}Msg`]: `Network error (attempt ${attempt+1})` }));
    }
    attempt++;
    await new Promise(r => setTimeout(r, delay));
    delay *= 2;
  }
  showToast(`${platform} verification failed after ${maxAttempts} attempts`, 4000);
  setValues((prev: ProfileState) => ({ ...prev, [`__${platform}Msg`]: 'Verification not found. Try again or request admin approval.' }));
}
