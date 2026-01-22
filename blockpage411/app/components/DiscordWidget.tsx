"use client";

import React from 'react';

const STORAGE_KEY = 'bp411:discord_widget_open';

function getStoredOpen(): boolean {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === null) return false;
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
}

function setStoredOpen(open: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  } catch {
    // ignore
  }
}

export default function DiscordWidget({ className = '' }: { className?: string }) {
  const serverId = process.env.NEXT_PUBLIC_DISCORD_SERVER_ID;
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(getStoredOpen());
  }, []);

  if (!serverId) {
    return (
      <div className={className} style={{ backgroundColor: '#070812', padding: 6, borderRadius: 8 }}>
        <div style={{ color: '#d1fae5' }} className="text-xs">
          Discord widget is not configured.
          {inviteUrl ? (
            <a className="ml-2 underline" style={{ color: '#9ae6b4' }} href={inviteUrl} target="_blank" rel="noopener noreferrer">
              Join via invite
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const src = `https://discord.com/widget?id=${encodeURIComponent(serverId)}&theme=dark`;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Community</div>
          <div className="text-xs text-slate-400">Discord</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => {
              const next = !prev;
              setStoredOpen(next);
              return next;
            });
          }}
          className="rounded-full border border-slate-600 bg-black/30 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-black/40"
          aria-label={open ? 'Hide Discord widget' : 'Show Discord widget'}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-700 bg-black/30">
          <iframe
            title="Discord community"
            src={src}
            width="100%"
            height={360}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            style={{ border: 0 }}
          />
          {inviteUrl ? (
            <div className="px-3 py-2 border-t border-slate-700 text-xs text-emerald-200 flex items-center justify-between">
              <span className="text-emerald-200">If the widget is blocked, use the invite link.</span>
              <a className="underline hover:text-emerald-100" href={inviteUrl} target="_blank" rel="noopener noreferrer">
                Join Discord
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
