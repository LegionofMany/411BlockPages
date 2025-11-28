"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../components/simpleToast';
import Skeleton from '../../components/ui/Skeleton';

type ProfileState = Record<string, any>;

interface CharityOption {
  charityId: string;
  name: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<ProfileState>({});
  const [charities, setCharities] = useState<CharityOption[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [meRes, charitiesRes, eventsRes] = await Promise.all([
          fetch('/api/me', { credentials: 'include' }),
          fetch('/api/charities'),
          fetch('/api/events/byUser/me'),
        ]);
        if (meRes.ok && mounted) {
          const me = await meRes.json();
          setValues({
            displayName: me.displayName || '',
            avatarUrl: me.avatarUrl || '',
            bio: me.bio || '',
            telegram: me.telegram || '',
            twitter: me.twitter || '',
            discord: me.discord || '',
            website: me.website || '',
            phoneApps: (me.phoneApps || []).join(', '),
            featuredCharityId: me.featuredCharityId || '',
            activeEventId: me.activeEventId || '',
            donationLink: me.donationLink || '',
            donationWidgetEnabled: !!me.donationWidgetEnabled,
          });
        }
        if (charitiesRes.ok && mounted) {
          const data = await charitiesRes.json();
          // API returns { results: [...] } — normalize to an array
          const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
          setCharities(list);
        }
        if (eventsRes.ok && mounted) {
          const data = await eventsRes.json();
          setEvents(data?.active || []);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/me/update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to save');
        showToast(data?.message || 'Failed to save', 3000);
        return;
      }
      showToast('Profile saved', 2000);
      router.push('/profile');
    } catch (err) {
      setError((err as Error).message || 'Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto p-6 pt-6">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-white hover:underline">← Back</button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-24 w-full rounded" />
          </div>
        ) : (
          <form onSubmit={save} className="space-y-6 bg-slate-900 p-6 rounded-lg border border-slate-800">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Display name</label>
              <input value={String(values.displayName ?? '')} onChange={e=>setValues({...values, displayName: e.target.value})} placeholder="Display name" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Bio</label>
              <textarea value={String(values.bio ?? '')} onChange={e=>setValues({...values, bio: e.target.value})} placeholder="Bio" className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-2">Telegram</label>

              <div className="flex gap-2 items-center">
                <input value={String(values.telegram ?? '')} onChange={e=>setValues({...values, telegram: e.target.value})} placeholder="Telegram handle" className="flex-1 rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <div className="text-sm text-slate-300">{values.telegram ? (values.telegramVerified ? <span className="text-emerald-300">Verified</span> : <span className="text-amber-300">Unverified</span>) : null}</div>
                <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded-full" onClick={async ()=>{ await requestSocialVerify('telegram', String(values.telegram||''), setValues); }}>Request Verify</button>
                {String(values['__telegramCode'] ?? '') ? (
                  <button type="button" className="px-3 py-2 bg-gray-600 text-white rounded-full" onClick={async ()=>{ try { await navigator.clipboard.writeText(String(values['__telegramCode'])); showToast('Code copied to clipboard', 2000); } catch {} }}>
                    Copy Code
                  </button>
                ) : null}
                <button type="button" className="px-3 py-2 bg-emerald-600 text-white rounded-full" onClick={async ()=>{ await confirmSocialVerify('telegram', String(values.telegram||''), setValues); }}>Check Verification</button>
              </div>
              {values.__telegramMsg ? <div className="text-sm text-slate-300 mt-1">{values.__telegramMsg}</div> : null}
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-2">Twitter</label>
              <div className="flex gap-2 items-center">
                <input value={String(values.twitter ?? '')} onChange={e=>setValues({...values, twitter: e.target.value})} placeholder="Twitter handle" className="flex-1 rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <div className="text-sm text-slate-300">{values.twitter ? (values.twitterVerified ? <span className="text-emerald-300">Verified</span> : <span className="text-amber-300">Unverified</span>) : null}</div>
                <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded-full" onClick={async ()=>{ await requestSocialVerify('twitter', String(values.twitter||''), setValues); }}>Request Verify</button>
                {String(values['__twitterCode'] ?? '') ? (
                  <button type="button" className="px-3 py-2 bg-gray-600 text-white rounded-full" onClick={async ()=>{ try { await navigator.clipboard.writeText(String(values['__twitterCode'])); showToast('Code copied to clipboard', 2000); } catch {} }}>
                    Copy Code
                  </button>
                ) : null}
                <button type="button" className="px-3 py-2 bg-emerald-600 text-white rounded-full" onClick={async ()=>{ await confirmSocialVerify('twitter', String(values.twitter||''), setValues); }}>Check Verification</button>
              </div>
              {values.__twitterMsg ? <div className="text-sm text-slate-300 mt-1">{values.__twitterMsg}</div> : null}
            </div>
            <div className="grid gap-3">
              <input value={String(values.discord ?? '')} onChange={e=>setValues({...values, discord: e.target.value})} placeholder="Discord" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              <input value={String(values.website ?? '')} onChange={e=>setValues({...values, website: e.target.value})} placeholder="Website" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              <input value={String(values.facebook ?? '')} onChange={e=>setValues({...values, facebook: e.target.value})} placeholder="Facebook" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              <input value={String(values.instagram ?? '')} onChange={e=>setValues({...values, instagram: e.target.value})} placeholder="Instagram" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              <input value={String(values.whatsapp ?? '')} onChange={e=>setValues({...values, whatsapp: e.target.value})} placeholder="WhatsApp" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              <input value={String(values.phoneApps ?? '')} onChange={e=>setValues({...values, phoneApps: e.target.value})} placeholder="Phone apps (comma separated) e.g. WhatsApp, Signal" className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>

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
                    className="w-full px-3 py-2 bg-black/40 rounded-full text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None</option>
                    {charities.map((c, idx) => (
                      <option key={c.charityId ?? (c as any)._id ?? idx} value={c.charityId ?? (c as any)._id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">This charity will be promoted by default on your profile.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Active event</label>
                  <select
                    value={String(values.activeEventId ?? '')}
                    onChange={e => setValues({ ...values, activeEventId: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 rounded-full text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3 py-2 bg-black/40 rounded-full text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <button disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-full">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={()=>router.push('/')} className="px-4 py-2 bg-gray-700 text-white rounded-full">Cancel</button>
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
