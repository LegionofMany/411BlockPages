"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

const DEFAULT_INVITE_URL = 'https://discord.gg/z8MgDnHdR';

type Props = {
  className?: string;
  title?: string;
  compact?: boolean;
};

function getInviteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;
  const url = String(fromEnv || '').trim();
  return url || DEFAULT_INVITE_URL;
}

function getWidgetUrl(): { src: string | null; serverId: string | null } {
  const raw = String(process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || '').trim();
  if (!raw) return { src: null, serverId: null };
  // Official Discord widget format:
  // https://discord.com/widget?id=SERVER_ID&theme=dark
  return {
    serverId: raw,
    src: `https://discord.com/widget?id=${encodeURIComponent(raw)}&theme=dark`,
  };
}

export default function DiscordCommunitySection({
  className = '',
  title = 'Join the BlockPages Community',
  compact = false,
}: Props) {
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const statusRes = await fetch('/api/auth/status', { credentials: 'include', cache: 'no-store' });
        const status = await statusRes.json().catch(() => ({} as any));
        if (!mounted) return;
        if (!status?.authenticated) {
          setSignedIn(false);
          setEligible(false);
          return;
        }

        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
        if (!mounted) return;
        if (!res.ok) {
          setSignedIn(true);
          setEligible(false);
          return;
        }
        const data = await res.json().catch(() => ({} as any));
        setSignedIn(true);
        setEligible(Boolean(data?.socialCredit?.discordEligible));
      } catch {
        if (!mounted) return;
        setSignedIn(false);
        setEligible(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const inviteUrl = getInviteUrl();
  const { src: widgetSrc } = getWidgetUrl();

  const showDiscord = eligible === true;
  const qrSrc = useMemo(() => {
    // QR code pointing at the invite; scanning should open Discord app if installed.
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`;
  }, [inviteUrl]);

  return (
    <section
      className={className}
      aria-label="Discord community"
    >
      <div className={compact ? '' : 'mb-3'}>
        <h2 className={compact ? 'text-base font-semibold text-slate-100' : 'text-xl font-semibold'} style={compact ? undefined : { color: '#fefce8' }}>
          {title}
        </h2>
        <p className={compact ? 'mt-1 text-xs text-slate-300' : 'mt-2 text-sm text-slate-300'}>
          Discord access unlocks after Base sign-in + a 795 social credit score.
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>
        <div className={compact ? '' : 'lg:col-span-2'}>
          {showDiscord && widgetSrc ? (
            <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-black/40">
              <iframe
                title="BlockPages Discord"
                src={widgetSrc}
                width="100%"
                height={compact ? 320 : 420}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups"
                referrerPolicy="no-referrer"
                style={{ border: 0, display: 'block' }}
              />
            </div>
          ) : showDiscord ? (
            <div className="w-full rounded-2xl border border-slate-800 bg-black/40 p-4">
              <div className="text-sm font-semibold text-slate-100">Join us on Discord</div>
              <div className="mt-1 text-xs text-slate-300">Use the invite below to join.</div>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-slate-800 bg-black/40 p-4">
              <div className="text-sm font-semibold text-slate-100">Discord is locked</div>
              <div className="mt-1 text-xs text-slate-300">
                {eligible === null
                  ? 'Checking your eligibility…'
                  : signedIn
                    ? 'Complete Base sign-in and finish your profile fields to unlock.'
                    : 'Sign in, enroll with Base, and complete your profile to unlock.'}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={signedIn ? '/profile' : '/login'}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  {signedIn ? 'Go to Profile' : 'Sign in'}
                </a>
                <a
                  href="/profile/edit"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Complete Profile
                </a>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {showDiscord ? (
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Join Discord
              </a>
            ) : (
              <span className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-400">
                Join Discord (locked)
              </span>
            )}
          </div>
        </div>

        <div className={compact ? '' : 'lg:col-span-1'}>
          <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
            <div className="text-sm font-semibold text-slate-100">Scan to join</div>
            <div className="mt-1 text-xs text-slate-300">
              Scan with your camera — it should open the Discord app if installed.
            </div>
            <div className="mt-3 flex items-center justify-center">
              {showDiscord ? (
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Discord invite"
                  className="inline-flex"
                >
                  <Image
                    src={qrSrc}
                    alt="Discord invite QR code"
                    width={220}
                    height={220}
                    className="h-auto w-full max-w-[220px] rounded-xl border border-slate-700"
                  />
                </a>
              ) : (
                <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="text-center text-xs text-slate-400">
                    QR hidden until unlocked
                  </div>
                </div>
              )}
            </div>
            {showDiscord ? (
              <div className="mt-3 text-[11px] text-slate-400 break-all">
                {inviteUrl}
              </div>
            ) : (
              <div className="mt-3 text-[11px] text-slate-500">
                Invite URL hidden until unlocked
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// TODO: To enable the official Discord embed, set NEXT_PUBLIC_DISCORD_SERVER_ID (Discord Server ID).
