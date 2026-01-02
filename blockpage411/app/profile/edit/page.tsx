"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const [outputSize, setOutputSize] = useState<number>(256);
  // client-side controls for processed output
  const [quality, setQuality] = useState<number>(0.9);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const MAX_CLIENT_FILE_BYTES = 3 * 1024 * 1024; // 3 MB
    // Cloudinary unsigned upload config
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME : undefined);
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET : undefined);

  useEffect(() => {
    let mounted = true;
    async function computePreview() {
      try {
        if (!cropModalOpen || !croppedAreaPixels) { setPreviewSize(null); return; }
        const blob = await getCroppedImg(avatarPreview || '', croppedAreaPixels, outputSize, quality);
        if (!mounted) return;
        setPreviewSize(blob ? blob.size : null);
      } catch (e) {
        if (!mounted) return;
        setPreviewSize(null);
      }
    }
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
            walletAddress: me.address,
            displayName: me.displayName || '',
              avatarUrl: me.avatarUrl || '',
            bio: me.bio || '',
            email: me.email || '',
            emailVerified: me.emailVerified || false,
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
          setAvatarPreview(me.avatarUrl || null);
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
        // compute preview size when modal opens
        computePreview();
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

    // Recompute preview size whenever crop, outputSize or quality change
    useEffect(() => {
      let mounted = true;
      async function computePreview() {
        try {
          if (!cropModalOpen || !croppedAreaPixels) { if (mounted) setPreviewSize(null); return; }
          const blob = await getCroppedImg(avatarPreview || '', croppedAreaPixels, outputSize, quality);
          if (!mounted) return;
          setPreviewSize(blob ? blob.size : null);
        } catch (e) {
          if (!mounted) return;
          setPreviewSize(null);
        }
      }
      computePreview();
      return () => { mounted = false; };
    }, [cropModalOpen, croppedAreaPixels, outputSize, quality, avatarPreview]);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Normalize values so we don't send invalid empty strings for URL fields
      const payload: ProfileState = { ...values };
      for (const key of ['avatarUrl', 'website', 'donationLink', 'nftAvatarUrl']) {
        const v = (payload as any)[key];
        if (typeof v === 'string' && v.trim() === '') {
          delete (payload as any)[key];
        }
      }

      // send update to wallet-linked profile endpoint
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: payload.walletAddress || payload.address, ...payload }),
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
      <main className="max-w-4xl mx-auto p-6 pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10"
          >
            <span className="text-[12px]"></span>
            Back
          </button>
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
            className="space-y-6 rounded-[1.5rem] p-6"
            style={{
              background:
                'radial-gradient(circle at 0% 0%, rgba(34,197,94,0.1), transparent 55%), radial-gradient(circle at 100% 120%, rgba(56,189,248,0.12), transparent 60%), rgba(0,0,0,0.9)',
              boxShadow: '0 22px 64px rgba(0,0,0,0.95)',
              border: '1px solid rgba(15,23,42,0.9)',
              maxWidth: '38rem',
              width: '100%',
              margin: '0 auto',
            }}
          >
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">Display name</label>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-16 w-16 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">No avatar</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    id="avatarFile"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      setUploadError(null);
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      const MAX_BYTES = 6 * 1024 * 1024; // allow slightly larger raw because we'll crop/compress
                      if (!f.type.startsWith('image/')) { setUploadError('Please upload an image file'); return; }
                      if (f.size > MAX_BYTES) { setUploadError('File is too large (max 6 MB)'); return; }
                      // Some images are extremely large (very tall panoramas). Downscale client-side
                      // to avoid browser/canvas memory limits before passing to the cropper.
                      try {
                        const origUrl = URL.createObjectURL(f);
                        const img = await createImage(origUrl);
                        const MAX_SIDE = 4096; // max width/height to display for cropping
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
                        setRawFile(fileToUse);
                        setAvatarPreview(previewUrl);
                        setCropModalOpen(true);
                      } catch (err) {
                        setUploadError('Failed to process image for cropping');
                      }
                    }}
                    className="text-sm"
                  />
                  <div className="text-xs text-slate-400">Recommended: square image. Max 3 MB. We resize to 256×256.</div>
                </div>
              </div>
              {cropModalOpen && rawFile && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                  onKeyDown={(e) => {
                    // keyboard shortcuts when modal is open
                    if (e.key === 'Escape') {
                      setCropModalOpen(false);
                      setRawFile(null);
                    }
                    if (e.key === 'Enter') {
                      // trigger apply
                      const applyBtn = document.getElementById('crop-apply-btn') as HTMLButtonElement | null;
                      applyBtn?.click();
                    }
                    // arrow keys to nudge crop
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                      const delta = 5; // pixels
                      setCrop((c) => {
                        const next = { ...c } as any;
                        if (e.key === 'ArrowUp') next.y = (next.y || 0) - delta;
                        if (e.key === 'ArrowDown') next.y = (next.y || 0) + delta;
                        if (e.key === 'ArrowLeft') next.x = (next.x || 0) - delta;
                        if (e.key === 'ArrowRight') next.x = (next.x || 0) + delta;
                        return next;
                      });
                    }
                    // +/- to control zoom (match slider bounds)
                    if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, z + 0.05));
                    if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(0.5, z - 0.05));
                  }}
                  tabIndex={-1}
                  ref={modalRef}
                >
                  <div className="bg-slate-900 p-4 rounded max-w-3xl w-full" role="dialog" aria-modal="true" aria-label="Crop avatar">
                    <div className="relative h-[420px] bg-black">
                      <Cropper
                        image={avatarPreview || ''}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_c, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-slate-300 mr-2">Zoom</label>
                        <Slider ariaLabelForHandle="Zoom" min={0.5} max={4} step={0.01} value={zoom} onChange={(v) => setZoom(Number(v))} />
                      </div>
                      <div className="flex items-center gap-3">
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
                        <div className="flex-1">
                          <label className="text-xs text-slate-300 mr-2">Quality</label>
                          <div className="flex items-center gap-2">
                            <Slider ariaLabelForHandle="Quality" min={0.5} max={0.95} step={0.01} value={quality} onChange={(v) => setQuality(Number(v))} />
                            <div className="text-xs text-slate-300 w-12 text-right">{Math.round(quality * 100)}%</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-xs text-slate-300">Estimated size:</div>
                          <div className="text-sm text-slate-200">{previewSize === null ? '—' : (previewSize > 1024 ? `${Math.round(previewSize/1024)} KB` : `${previewSize} B`)}</div>
                          {previewSize !== null && previewSize > MAX_CLIENT_FILE_BYTES ? (
                            <div className="text-xs text-red-400 mt-1">Processed image too large. Reduce size or quality.</div>
                          ) : null}
                          {previewSize !== null && previewSize > MAX_CLIENT_FILE_BYTES ? (
                            (() => {
                              const suggested = Math.max(0.5, Math.round((quality * (MAX_CLIENT_FILE_BYTES / previewSize)) * 100) / 100);
                              return (
                                <div className="text-xs text-slate-300 mt-1">Try quality ~{Math.round(suggested * 100)}% or click Apply to auto-reduce.</div>
                              );
                            })()
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setCropModalOpen(false); setRawFile(null); }} className="px-3 py-1 rounded bg-slate-700">Cancel</button>
                          {!croppedAreaPixels ? (
                            <div className="text-xs text-slate-400 mr-2 self-center">Adjust crop area and zoom to enable Apply</div>
                          ) : null}
                          <button id="crop-apply-btn" aria-disabled={!croppedAreaPixels || uploading} disabled={!croppedAreaPixels || uploading} type="button" onClick={async () => {
                            // get cropped blob and auto-reduce quality if needed (try to fit within MAX_CLIENT_FILE_BYTES)
                            try {
                              setUploading(true);
                              let attemptQuality = quality;
                              let blob: Blob | null = null;
                              const minQuality = 0.5;
                              const step = 0.05;
                              // attempt reductions up to reasonable number of steps
                              for (let i = 0; i < 12; i++) {
                                blob = await getCroppedImg(avatarPreview || '', croppedAreaPixels, outputSize, attemptQuality);
                                if (!blob) break;
                                if (blob.size <= MAX_CLIENT_FILE_BYTES) break;
                                const next = Math.max(minQuality, Math.round((attemptQuality - step) * 100) / 100);
                                if (next === attemptQuality) break;
                                attemptQuality = next;
                              }
                              if (!blob) throw new Error('Crop failed');
                              if (blob.size > MAX_CLIENT_FILE_BYTES) {
                                setUploadError('Processed image still too large. Please choose a smaller crop or lower quality.');
                                setUploading(false);
                                return;
                              }
                              // update quality state to reflect any auto-reduction
                              if (attemptQuality !== quality) setQuality(attemptQuality);
                              const f = new File([blob], 'avatar.webp', { type: 'image/webp' });
                              let url: string | undefined;
                              // Try unsigned Cloudinary upload first
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
                              // Fallback to server upload if Cloudinary fails or not configured
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
                                setValues((prev: ProfileState) => ({ ...prev, avatarUrl: url }));
                                setAvatarPreview(url);
                                setCropModalOpen(false);
                                setRawFile(null);
                              }
                              setUploading(false);
                            } catch (err) {
                              setUploadError((err as Error).message || 'Crop/upload failed');
                              setUploading(false);
                            }
                          }} className={`px-3 py-1 rounded font-semibold ${(!croppedAreaPixels || uploading) ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 text-black'}`}>Apply</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <input
                value={String(values.displayName ?? '')}
                onChange={e=>setValues({...values, displayName: e.target.value})}
                placeholder="Display name"
                className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">Bio</label>
              <textarea
                value={String(values.bio ?? '')}
                onChange={e=>setValues({...values, bio: e.target.value})}
                placeholder="Short description for your public profile"
                className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">Telegram</label>
              <input
                value={String(values.telegram ?? '')}
                onChange={e=>setValues({...values, telegram: e.target.value})}
                placeholder="Telegram handle"
                className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              {values.__telegramMsg ? <div className="text-sm text-slate-300 mt-1">{values.__telegramMsg}</div> : null}
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">Twitter</label>
              <input
                value={String(values.twitter ?? '')}
                onChange={e=>setValues({...values, twitter: e.target.value})}
                placeholder="Twitter handle"
                className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              {values.__twitterMsg ? <div className="text-sm text-slate-300 mt-1">{values.__twitterMsg}</div> : null}
            </div>
            <div className="grid gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.16em]">Email</label>
                <input
                  value={String(values.email ?? '')}
                  onChange={e=>setValues({...values, email: e.target.value})}
                  placeholder="you@example.com"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Discord</label>
                <input
                  value={String(values.discord ?? '')}
                  onChange={e=>setValues({...values, discord: e.target.value})}
                  placeholder="Discord"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Website</label>
                <input
                  value={String(values.website ?? '')}
                  onChange={e=>setValues({...values, website: e.target.value})}
                  placeholder="Website"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Facebook</label>
                <input
                  value={String(values.facebook ?? '')}
                  onChange={e=>setValues({...values, facebook: e.target.value})}
                  placeholder="Facebook"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Instagram</label>
                <input
                  value={String(values.instagram ?? '')}
                  onChange={e=>setValues({...values, instagram: e.target.value})}
                  placeholder="Instagram"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">WhatsApp</label>
                <input
                  value={String(values.whatsapp ?? '')}
                  onChange={e=>setValues({...values, whatsapp: e.target.value})}
                  placeholder="WhatsApp"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 font-medium uppercase tracking-[0.12em]">Phone apps</label>
                <input
                  value={String(values.phoneApps ?? '')}
                  onChange={e=>setValues({...values, phoneApps: e.target.value})}
                  placeholder="Phone apps (comma separated) e.g. WhatsApp, Signal"
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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
                    {charities.map((c, idx) => (
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
            <div className="flex gap-3 pt-2">
              <button
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-full text-sm font-semibold shadow-sm hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={()=>router.push('/')}
                className="px-4 py-2.5 bg-slate-800 text-slate-100 rounded-full text-sm hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => { await requestAllVerifications(values, setValues); }}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-500"
              >
                Request Verification
              </button>
            </div>
          </form>
        )}
      </main>
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
  const platforms = ['telegram', 'twitter', 'discord', 'facebook', 'instagram'];
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
