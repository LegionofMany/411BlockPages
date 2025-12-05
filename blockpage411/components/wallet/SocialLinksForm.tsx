"use client";
import React, { useEffect, useState } from 'react';
import SocialLinkItem from './SocialLinkItem';

type SocialLinks = {
  twitter?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  linkedin?: string;
  discord?: string;
  website?: string;
};

type SocialLinksFormProps = {
  initial?: SocialLinks;
};

export default function SocialLinksForm({ initial }: SocialLinksFormProps) {
  const [links, setLinks] = useState<SocialLinks>(initial || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setLinks(initial);
  }, [initial]);

  const updateField = (key: keyof SocialLinks, value: string) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(links),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setMessage('Social links saved');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-black/80 p-5 text-amber-50">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Social presence
          </p>
          <h2 className="text-base font-semibold text-amber-50">Connect your social profiles</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <SocialLinkItem
            label="Twitter / X"
            placeholder="https://x.com/username"
            value={links.twitter || ''}
            onChange={(v) => updateField('twitter', v)}
          />
          <SocialLinkItem
            label="Instagram"
            placeholder="https://instagram.com/username"
            value={links.instagram || ''}
            onChange={(v) => updateField('instagram', v)}
          />
          <SocialLinkItem
            label="Telegram"
            placeholder="https://t.me/username"
            value={links.telegram || ''}
            onChange={(v) => updateField('telegram', v)}
          />
          <SocialLinkItem
            label="WhatsApp"
            placeholder="https://wa.me/1234567890"
            value={links.whatsapp || ''}
            onChange={(v) => updateField('whatsapp', v)}
          />
          <SocialLinkItem
            label="LinkedIn"
            placeholder="https://www.linkedin.com/in/username"
            value={links.linkedin || ''}
            onChange={(v) => updateField('linkedin', v)}
          />
          <SocialLinkItem
            label="Discord"
            placeholder="https://discord.com/users/your-id"
            value={links.discord || ''}
            onChange={(v) => updateField('discord', v)}
          />
          <SocialLinkItem
            label="Website"
            placeholder="https://your-site.xyz"
            value={links.website || ''}
            onChange={(v) => updateField('website', v)}
          />
        </div>

        {message && (
          <p className="text-[11px] text-emerald-200">{message}</p>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-50 transition"
          >
            {saving ? 'Saving…' : 'Save social links'}
          </button>
        </div>
      </form>
    </section>
  );
}
