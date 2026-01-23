"use client";

import React from 'react';
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
  const inviteUrl = getInviteUrl();
  const { src: widgetSrc, serverId } = getWidgetUrl();

  // QR code pointing at the invite; scanning should open Discord app if installed.
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`;

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
          Discord is our community hub. No wallet or login required to join.
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>
        <div className={compact ? '' : 'lg:col-span-2'}>
          {widgetSrc ? (
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
          ) : (
            <div className="w-full rounded-2xl border border-slate-800 bg-black/40 p-4">
              <div className="text-sm font-semibold text-slate-100">Discord widget coming soon</div>
              <div className="mt-1 text-xs text-slate-300">
                We haven’t configured the Discord Server ID yet, so the embed can’t render.
              </div>
              {/* TODO: Set NEXT_PUBLIC_DISCORD_SERVER_ID (Discord Server ID) to enable the official widget embed. */}
              <div className="mt-3 text-[11px] text-slate-400">
                Server ID placeholder: <span className="font-mono">{serverId || 'SERVER_ID_HERE'}</span>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Join Discord
            </a>
            <span className="text-xs text-slate-400">
              Opens in a new tab — no wallet popup.
            </span>
          </div>
        </div>

        <div className={compact ? '' : 'lg:col-span-1'}>
          <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
            <div className="text-sm font-semibold text-slate-100">Scan to join</div>
            <div className="mt-1 text-xs text-slate-300">
              Scan with your camera — it should open the Discord app if installed.
            </div>
            <div className="mt-3 flex items-center justify-center">
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
            </div>
            <div className="mt-3 text-[11px] text-slate-400 break-all">
              {inviteUrl}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
