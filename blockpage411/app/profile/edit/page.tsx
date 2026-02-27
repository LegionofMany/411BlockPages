"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import Slider from 'rc-slider';
import { showToast } from '../../components/simpleToast';
import Skeleton from '../../components/ui/Skeleton';

type ProfileState = Record<string, any>;

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void | Promise<void>, waitMs: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      void fn(...args);
    }, waitMs);
  };
}

interface CharityOption {
  charityId: string;
  name: string;
}

const MAX_CLIENT_FILE_BYTES = 2 * 1024 * 1024; // 2 MB raw upload limit (match server)
const TARGET_AVATAR_MAX_BYTES = 150 * 1024; // we aim for ~150 KB final avatar for fast loads

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [values, setValues] = useState<ProfileState>({});
  const [serverValues, setServerValues] = useState<ProfileState>({});
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autosaveMessage, setAutosaveMessage] = useState<string>('');
  const [charities, setCharities] = useState<CharityOption[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Avatar + crop state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any | null>(null);
  const [outputSize, setOutputSize] = useState(256);
  const [quality, setQuality] = useState(0.9);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Cloudinary env (optional)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

  // Load form state from localStorage on page load
  useEffect(() => {
    const savedState = localStorage.getItem('profileFormState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setValues((prev) => ({ ...prev, ...parsedState }));
      } catch (err) {
        console.warn('Failed to parse saved form state', err);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const [meRes, charitiesRes, eventsRes] = await Promise.all([
          fetch('/api/me', { credentials: 'include' }),
          fetch('/api/charities'),
          fetch('/api/events/byUser/me'),
        ]);

        if (!mounted) return;
        if (!meRes.ok) {
          setError('Failed to load profile');
          return;
        }

        const meJson = await meRes.json();
        if (!mounted) return;
        setMe(meJson);

        let charitiesData: any[] = [];
        if (charitiesRes.ok) {
          const c = await charitiesRes.json();
          if (Array.isArray(c)) charitiesData = c;
          else if (Array.isArray((c as any)?.results)) charitiesData = (c as any).results;
        }

        let eventsData: any[] = [];
        if (eventsRes.ok) {
          const ev = await eventsRes.json();
          if (Array.isArray(ev)) eventsData = ev;
          else if (Array.isArray((ev as any)?.results)) eventsData = (ev as any).results;
        }

        const nextFromServer: ProfileState = {
          walletAddress: meJson.address || undefined,
          displayName: meJson.displayName || '',
          bio: meJson.bio || '',
          avatarUrl: meJson.avatarUrl || '',
          nftAvatarUrl: meJson.nftAvatarUrl || '',
          udDomain: meJson.udDomain || '',
          directoryOptIn: Boolean(meJson.directoryOptIn),
          telegram: meJson.telegram || '',
          twitter: meJson.twitter || '',
          discord: meJson.discord || '',
          linkedin: meJson.linkedin || '',
          website: meJson.website || '',
          instagram: meJson.instagram || '',
          facebook: meJson.facebook || '',
          whatsapp: meJson.whatsapp || '',
          phoneApps: Array.isArray(meJson.phoneApps) ? meJson.phoneApps.join(', ') : (meJson.phoneApps || ''),
          email: meJson.email || '',
          featuredCharityId: meJson.featuredCharityId || '',
          activeEventId: meJson.activeEventId || '',
          donationLink: meJson.donationLink || '',
          donationWidgetEmbed: meJson.donationWidgetEmbed || null,
          donationRequests: Array.isArray(meJson.donationRequests) ? meJson.donationRequests : [],
        };

        // Preserve any localStorage draft values already loaded.
        setValues((prev) => ({ ...nextFromServer, ...prev, walletAddress: meJson.address || undefined }));
        setServerValues(nextFromServer);

        setAvatarPreview(meJson.avatarUrl || null);
        setCharities(charitiesData as any);
        setEvents(eventsData);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError('Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const isKycLocked = String(me?.kycStatus || '') === 'verified';

  const debouncedSave = useRef(
    debounce(async (patch: Record<string, any>) => {
      try {
        setAutosaveStatus('saving');
        setAutosaveMessage('Saving…');
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          setAutosaveStatus('saved');
          setAutosaveMessage('Saved ✓');
          setServerValues((prev) => ({ ...prev, ...patch }));
        } else {
          const data = await res.json();
          setAutosaveStatus('error');
          setAutosaveMessage(data?.message || 'Failed to save');
        }
      } catch {
        setAutosaveStatus('error');
        setAutosaveMessage('Network error while saving');
      }
    }, 1500)
  ).current;

  const handleFieldChange = (field: string, value: any) => {
    setValues((prev) => {
      const updatedValues = { ...prev, [field]: value };
      localStorage.setItem('profileFormState', JSON.stringify(updatedValues));
      debouncedSave({ [field]: value });
      return updatedValues;
    });
  };

  const renderMultiInput = (opts: {
    field: string;
    label: string;
    placeholder: string;
    type?: React.HTMLInputTypeAttribute;
    disabled?: boolean;
    helpText?: string;
  }) => {
    const { field, label, placeholder, type = 'text', disabled, helpText } = opts;
    const raw = String((values as any)[field] ?? '');
    const lines = raw.length ? raw.split('\n') : [''];

    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="block text-[11px] text-slate-300 font-medium uppercase tracking-[0.16em]">{label}</label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = raw ? `${raw}\n` : '\n';
              handleFieldChange(field, next);
            }}
            className="h-6 w-6 rounded-full border border-emerald-400/50 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Add another ${label}`}
            title="Add another"
          >
            +
          </button>
        </div>

        <div className="space-y-2">
          {lines.map((val, idx) => (
            <input
              key={`${field}-${idx}`}
              type={type}
              value={val}
              onChange={(e) => {
                const nextLines = [...lines];
                nextLines[idx] = e.target.value;
                handleFieldChange(field, nextLines.join('\n'));
              }}
              placeholder={placeholder}
              className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              disabled={disabled}
            />
          ))}
        </div>

        {helpText ? <p className="text-[11px] text-slate-400 mt-1">{helpText}</p> : null}
      </div>
    );
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Only send changed fields; do not clobber existing profile with blanks.
      const patch: Record<string, any> = {};
      for (const [k, v] of Object.entries(values)) {
        if (k === 'walletAddress') continue;
        const prev = (serverValues as any)[k];
        const next = v;
        const bothEmpty = (prev === undefined || prev === null || prev === '') && (next === undefined || next === null || next === '');
        if (bothEmpty) continue;
        if (JSON.stringify(prev) !== JSON.stringify(next)) patch[k] = next;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to save profile');
        showToast(data?.message || 'Failed to save profile', 4000);
        return;
      }
      showToast('Profile updated', 3000);
      localStorage.removeItem('profileFormState'); // Clear localStorage on successful save
      setServerValues(values);
      router.refresh?.();
    } catch (err) {
      setError('Network error while saving');
      showToast('Network error while saving', 4000);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!avatarPreview || !croppedAreaPixels) {
        if (mounted) setPreviewSize(null);
        return;
      }
      try {
        const b = await getCroppedImg(avatarPreview, croppedAreaPixels, outputSize, quality);
        if (!mounted) return;
        setPreviewSize(b ? b.size : null);
      } catch (err) {
        if (mounted) setPreviewSize(null);
      }
    })();
    return () => { mounted = false; };
  }, [avatarPreview, croppedAreaPixels, outputSize, quality]);

  // Revoke object URL previews when they change/unmount to avoid leaks
  useEffect(() => {
    return () => {
      try {
        if (avatarPreview && avatarPreview.startsWith && avatarPreview.startsWith('blob:')) {
          URL.revokeObjectURL(avatarPreview);
        }
      } catch (_) {}
    };
  }, [avatarPreview]);

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {autosaveStatus !== 'idle' ? autosaveMessage : null}
          </div>
          <button onClick={() => router.back()} className="text-sm text-white hover:underline">← Back</button>
          <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: '#22c55e' }}>
            Profile settings
          </span>
        </div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#fefce8' }}>Edit profile</h1>
        <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>
          Refine your public identity, social proofs, and charity presets.
        </p>

        <details className="mb-4 rounded-md bg-slate-900/50 p-3 border border-slate-700 text-sm text-slate-300">
          <summary className="cursor-pointer font-medium text-emerald-200">Social verification (simple)</summary>
          <p className="mt-2">Provide your bio and social handles below, then click "Request Verification Review" to submit your handle for manual review. An administrator will respond within 48 hours.</p>
        </details>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-24 w-full rounded" />
          </div>
        ) : (
          <form
            onSubmit={save}
            className="space-y-6 rounded-[1.5rem] p-6 w-full"
            style={{
              background:
                'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.1), transparent 55%), radial-gradient(circle at 100% 120%, rgba(56,189,248,0.12), transparent 60%), rgba(0,0,0,0.9)',
              boxShadow: '0 22px 64px rgba(0,0,0,0.95)',
              border: '1px solid rgba(15,23,42,0.9)',
              maxWidth: '100%',
              width: '100%',
            }}
          >
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">
                Profile photo & display name
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <div
                  className="relative flex-shrink-0 h-16 w-16 rounded-full overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs">No avatar</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1.5 text-xs w-full">
                  <label
                    htmlFor="avatarFile"
                    className="inline-flex w-full sm:w-max justify-center sm:justify-start cursor-pointer items-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 font-medium text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Change photo
                  </label>
                  <input
                    id="avatarFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      setUploadError(null);
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      const MAX_BYTES = MAX_CLIENT_FILE_BYTES; // 2 MB
                      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                      if (!allowed.includes((f.type || '').toLowerCase())) { setUploadError('Invalid file type. Allowed: jpg, png, webp'); return; }
                      if (f.size > MAX_BYTES) { setUploadError('File is too large (max 2 MB)'); return; }
                      try {
                        const origUrl = URL.createObjectURL(f);
                        const img = await createImage(origUrl);
                        const MAX_SIDE = 4096;
                        let fileToUse: File = f;
                        let previewUrl = origUrl;
                        if (img.naturalWidth > MAX_SIDE || img.naturalHeight > MAX_SIDE) {
                          const scale = MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight);
                          const canvas = document.createElement('canvas');
                          canvas.width = Math.round(img.naturalWidth * scale);
                          canvas.height = Math.round(img.naturalHeight * scale);
                          const ctx = canvas.getContext('2d');
                          if (!ctx) throw new Error('Canvas unsupported');
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.92));
                          if (blob) {
                            fileToUse = new File([blob], f.name, { type: blob.type });
                            previewUrl = URL.createObjectURL(blob);
                            URL.revokeObjectURL(origUrl);
                          }
                        }
                        // Reset crop state for a fresh, controllable experience
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                        setCroppedAreaPixels(null);
                        setRawFile(fileToUse);
                        setAvatarPreview(previewUrl);
                        setCropModalOpen(true);
                      } catch (err) {
                        setUploadError('Failed to process image for cropping');
                      }
                    }}
                    className="hidden"
                  />
                  <div className="text-xs text-slate-400">Recommended: square image. Max 2 MB. We resize to 256×256.</div>
                  {uploadError && <div className="text-[11px] text-red-400">{uploadError}</div>}
                </div>
              </div>
              <input
                value={String(values.displayName ?? '')}
                onChange={(e) => handleFieldChange('displayName', e.target.value)}
                placeholder="Display name"
                className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">Bio</label>
              <textarea
                value={String(values.bio ?? '')}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                placeholder="Short description for your public profile"
                className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

             <div className="grid gap-3">
              {renderMultiInput({
                field: 'udDomain',
                label: 'Unstoppable Domain (UD)',
                placeholder: 'yourname.crypto',
                disabled: isKycLocked,
                helpText: 'We verify ownership by resolving the domain to your wallet on save.',
              })}

              <div id="phone-book-listing" className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded px-3 py-2 scroll-mt-24">
                <div>
                  <div className="text-sm font-medium text-slate-100">List me in the Phone Book</div>
                  <p className="text-xs text-slate-400">Allows others to discover your profile in the directory.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Takes effect after you save.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValues({ ...values, directoryOptIn: !values.directoryOptIn })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.directoryOptIn ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  aria-label="Toggle Phone Book listing"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${values.directoryOptIn ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
            {renderMultiInput({ field: 'telegram', label: 'Telegram', placeholder: 'Telegram handle', disabled: isKycLocked })}
            {values.__telegramMsg ? <div className="text-sm text-slate-300 mt-1">{values.__telegramMsg}</div> : null}

            {renderMultiInput({ field: 'twitter', label: 'Twitter', placeholder: 'Twitter handle', disabled: isKycLocked })}
            {values.__twitterMsg ? <div className="text-sm text-slate-300 mt-1">{values.__twitterMsg}</div> : null}
            <div className="grid gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Email</label>
                <input
                  value={String(values.email ?? '')}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  disabled={isKycLocked}
                />
              </div>
              {renderMultiInput({ field: 'discord', label: 'Discord', placeholder: 'Discord', disabled: isKycLocked })}

              {renderMultiInput({ field: 'website', label: 'Website', placeholder: 'https://your-site.xyz', type: 'url', disabled: isKycLocked })}

              {renderMultiInput({ field: 'linkedin', label: 'LinkedIn', placeholder: 'LinkedIn profile URL or handle' })}

              {renderMultiInput({ field: 'facebook', label: 'Facebook', placeholder: 'Facebook profile URL or handle' })}

              {renderMultiInput({ field: 'instagram', label: 'Instagram', placeholder: 'Instagram profile URL or handle' })}

              {renderMultiInput({ field: 'whatsapp', label: 'WhatsApp', placeholder: 'WhatsApp link or handle' })}

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Phone apps</label>
                <input
                  value={String(values.phoneApps ?? '')}
                  onChange={(e) => handleFieldChange('phoneApps', e.target.value)}
                  placeholder="Phone apps (comma separated) e.g. WhatsApp, Signal"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  disabled={isKycLocked}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-2">
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#fefce8' }}>Charity presets</h2>
              <p className="text-xs text-slate-300 mb-4">
                Choose which charity and campaign your profile promotes by default.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1 uppercase tracking-[0.12em]">Featured charity</label>
                  <select
                    value={String(values.featuredCharityId ?? '')}
                    onChange={e => setValues({ ...values, featuredCharityId: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 rounded-full text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None</option>
                    {(Array.isArray(charities) ? charities : []).map((c, idx) => (
                      <option key={c.charityId ?? (c as any)._id ?? idx} value={c.charityId ?? (c as any)._id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">This charity will be promoted by default on your profile.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1 uppercase tracking-[0.12em]">Active event</label>
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
                  <label className="block text-xs font-medium text-slate-200 mb-1 uppercase tracking-[0.12em]">Donation link (optional)</label>
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
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-900 rounded-md text-sm font-semibold shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 border border-slate-200"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={()=>router.push('/')}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white text-slate-900 rounded-md text-sm hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => { await requestAllVerifications(values, setValues); }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white text-slate-900 rounded-md text-sm hover:bg-slate-100 border border-slate-200"
                >
                  Request Verification
                </button>
            </div>
          </form>
        )}
      </main>
      {cropModalOpen && rawFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          tabIndex={-1}
          ref={modalRef}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setCropModalOpen(false);
              setRawFile(null);
            }
            if (e.key === 'Enter') {
              const applyBtn = document.getElementById('crop-apply-btn') as HTMLButtonElement | null;
              applyBtn?.click();
            }
          }}
        >
          <div className="bg-slate-900 p-4 rounded sm:rounded max-w-3xl w-full h-full sm:h-auto sm:my-auto" role="dialog" aria-modal="true" aria-label="Crop avatar">
            <div className="relative h-[60vh] sm:h-[420px] bg-black">
              <Cropper
                image={avatarPreview || ''}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_c, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>
            <div className="mt-3 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-300 mr-2">Zoom</label>
                  <Slider ariaLabelForHandle="Zoom" min={0.3} max={4} step={0.01} value={zoom} onChange={(v) => setZoom(Number(v))} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-300 mr-2">Output</label>
                  <div className="flex gap-1">
                    {[128, 256, 512].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setOutputSize(s)}
                        className={`px-2 py-1 text-xs rounded ${outputSize === s ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-300 mr-2">Quality</label>
                  <div className="flex items-center gap-2">
                    <Slider ariaLabelForHandle="Quality" min={0.5} max={0.95} step={0.01} value={quality} onChange={(v) => setQuality(Number(v))} />
                    <div className="text-xs text-slate-300 w-12 text-right">{Math.round(quality * 100)}%</div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    If the processed image is too large, we'll ask you to reduce size or quality.
                  </p>
                </div>
                <div className="flex flex-col items-end text-right">
                  <div className="text-xs text-slate-300">Estimated size:</div>
                  <div className="text-sm text-slate-200">{previewSize === null ? '—' : (previewSize > 1024 ? `${Math.round(previewSize/1024)} KB` : `${previewSize} B`)}</div>
                  {previewSize !== null && previewSize > TARGET_AVATAR_MAX_BYTES && (
                    <div className="text-xs text-red-400 mt-1">Processed image exceeds target (≤150 KB). We'll attempt further optimization on Apply.</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[11px] text-slate-400">
                  Drag to reposition; use zoom to fine-tune your circular avatar. We will try to optimize the final avatar to be ≤150 KB for faster page loads.
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-400 mr-3">Optimizing to ≤150 KB</div>
                  {!croppedAreaPixels && (
                    <div className="text-xs text-slate-400 mr-2">Adjust crop and zoom to enable Apply</div>
                  )}
                  <button
                    id="crop-apply-btn"
                    type="button"
                    disabled={!croppedAreaPixels || uploading}
                    aria-disabled={!croppedAreaPixels || uploading}
                    className={`px-3 py-1 rounded font-semibold ${(!croppedAreaPixels || uploading) ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 text-black'}`}
                    onClick={async () => {
                      try {
                        setUploading(true);
                        setUploadError(null);

                        // Try multiple output sizes (starting with the chosen outputSize then smaller)
                        const trySizes = [outputSize, 256, 192, 128].filter((v, i, a) => a.indexOf(v) === i);
                        const minQuality = 0.3; // allow slightly lower quality to hit size target
                        const qualityStep = 0.05;

                        let finalBlob: Blob | null = null;
                        let finalQuality = quality;
                        let usedSize = outputSize;

                        for (const size of trySizes) {
                          let attemptQuality = quality;
                          // try reducing quality until under limit or minimum
                          for (let i = 0; i < 12; i++) {
                            const b = await getCroppedImg(avatarPreview || '', croppedAreaPixels, size, attemptQuality);
                            if (!b) break;
                            if (b.size <= TARGET_AVATAR_MAX_BYTES) {
                              finalBlob = b;
                              finalQuality = attemptQuality;
                              usedSize = size;
                              break;
                            }
                            const next = Math.max(minQuality, Math.round((attemptQuality - qualityStep) * 100) / 100);
                            if (next === attemptQuality) break;
                            attemptQuality = next;
                          }
                          if (finalBlob) break;
                        }

                        if (!finalBlob) {
                          setUploadError('Processed image still too large. Try a smaller crop or reduce output size.');
                          setUploading(false);
                          return;
                        }

                        // Update preview size & quality state
                        setPreviewSize(finalBlob.size);
                        if (finalQuality !== quality) setQuality(finalQuality);
                        if (usedSize !== outputSize) setOutputSize(usedSize);

                        // If final blob still larger than our target, inform and offer to force a tighter reduction
                        if (finalBlob.size > TARGET_AVATAR_MAX_BYTES) {
                          // best-effort: attempt one last pass to force 128px and lower quality
                          try {
                            const forced = await getCroppedImg(avatarPreview || '', croppedAreaPixels, 128, Math.max(minQuality, finalQuality - 0.05));
                            if (forced && forced.size <= TARGET_AVATAR_MAX_BYTES) {
                              finalBlob = forced;
                              setPreviewSize(finalBlob.size);
                              setOutputSize(128);
                              setQuality(Math.max(minQuality, finalQuality - 0.05));
                            } else {
                              setUploadError('Could not compress avatar to target size; consider cropping a smaller area.');
                            }
                          } catch (_) {
                            setUploadError('Could not compress avatar to target size; consider cropping a smaller area.');
                          }

                          if (finalBlob.size > TARGET_AVATAR_MAX_BYTES) {
                            setUploading(false);
                            return;
                          }
                        }

                        const f = new File([finalBlob], 'avatar.webp', { type: 'image/webp' });
                        let url: string | undefined;

                        if (cloudName && uploadPreset) {
                          const fd = new FormData();
                          fd.append('file', f);
                          fd.append('upload_preset', uploadPreset);
                          const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                          const res = await fetch(cloudUrl, { method: 'POST', body: fd });
                          const json = await res.json();
                          if (res.ok && json.secure_url) {
                            url = json.secure_url;
                          } else {
                            setUploadError(json?.error?.message || 'Cloudinary upload failed');
                          }
                        }

                        if (!url) {
                          const fd = new FormData();
                          fd.append('file', f);
                          const upRes = await fetch('/api/avatar/upload', { method: 'POST', body: fd });
                          const upJson = await upRes.json();
                          if (upRes.ok && upJson.url) {
                            url = upJson.url;
                          } else {
                            setUploadError(upJson?.message || 'Upload failed');
                          }
                        }

                        if (url) {
                          handleFieldChange('avatarUrl', url);
                          setAvatarPreview(url);
                          setCropModalOpen(false);
                          setRawFile(null);
                        }

                        setUploading(false);
                      } catch (err) {
                        const msg = (err as Error).message || '';
                        if (/security|taint|cross-origin|CORS/i.test(msg)) {
                          setUploadError('Crop failed: image host may block cross-origin canvas operations. Try re-uploading the file or use a different image.');
                        } else {
                          setUploadError(msg || 'Crop/upload failed');
                        }
                        setUploading(false);
                      }
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function requestEmailVerify(email: string) {
  if (!email) { showToast('Please enter an email first', 3000); return; }
  try {
    const res = await fetch('/api/verify/email/request', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (!res.ok) { showToast(data?.message || 'Request failed', 4000); return; }
    showToast('Verification email sent. Check your inbox.', 5000);
  } catch {
    showToast('Network error', 3000);
  }
}

// The old automatic verification helper has been removed — use the "Request Verification Review" button.

async function requestAllVerifications(
  values: ProfileState,
  setValues: React.Dispatch<React.SetStateAction<ProfileState>>
) {
  // collect common handles
  const platforms = ['telegram', 'twitter', 'discord', 'facebook', 'instagram', 'linkedin'];
  const handles = platforms.map(p => ({ platform: p, handle: String(values[p] || '').trim() })).filter(h => h.handle);
  if (handles.length === 0) { showToast('No social handles filled to request verification for', 3000); return; }
  try {
    const res = await fetch('/api/verify/social/request-bulk', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handles }) });
    const data = await res.json();
    if (!res.ok) { showToast(data?.message || 'Request failed', 4000); return; }
    showToast(data?.message || 'Verification review requested', 5000);
    // set a small status message per platform
    setValues((prev: ProfileState) => {
      const copy = { ...prev };
      for (const h of handles) copy[`__${h.platform}Msg`] = 'Requested review';
      return copy;
    });
  } catch (err) {
    showToast('Network error', 3000);
  }
}

// Helper to create cropped image blob from source image and crop box
async function getCroppedImg(imageSrc: string, pixelCrop: any, size = 256, quality = 0.9): Promise<Blob | null> {
  if (!imageSrc || !pixelCrop) return null;
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // draw the cropped area to the canvas at target size
  const scaleX = image.naturalWidth / (image.width || image.naturalWidth);
  const scaleY = image.naturalHeight / (image.height || image.naturalHeight);
  const sx = pixelCrop.x * scaleX;
  const sy = pixelCrop.y * scaleY;
  const sWidth = pixelCrop.width * scaleX;
  const sHeight = pixelCrop.height * scaleY;

  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, size, size);

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    // For remote images (Cloudinary etc.) set crossOrigin to allow canvas operations
    // For blob: URLs we avoid setting crossOrigin because it can cause load failures
    try {
      if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        img.crossOrigin = 'anonymous';
      }
    } catch (_) {}
    img.src = url;
  });
}
