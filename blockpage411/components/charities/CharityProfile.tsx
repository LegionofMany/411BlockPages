"use client";

import React, { useEffect, useState } from "react";
import DonateModal, { CharityWallet } from "./DonateModal";
import { isTrustedGivingBlockEmbed } from "../../utils/embed";
import { explorerUrlFor } from "../../lib/explorer";

export interface CharityDetail {
  _id?: string;
  givingBlockId?: string;
  charityId?: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  wallet?: string;
  donationAddress?: string;
  tags?: string[];
  categories?: string[];
  givingBlockEmbedUrl?: string;
  socials?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  wallets?: CharityWallet[];
}

interface Props {
  charity: CharityDetail;
}

export default function CharityProfile({ charity }: Props) {
  const [showDonate, setShowDonate] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const safeTextStyle: React.CSSProperties = { overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" };

  const wallets: CharityWallet[] =
    charity.wallets ||
    (charity.donationAddress
      ? [{ chain: "ethereum", address: charity.donationAddress, label: "Main" }]
      : charity.wallet
      ? [{ chain: "ethereum", address: charity.wallet, label: "Main" }]
      : []);

  const hasDirectWallet = wallets.length > 0;
  const hasGivingBlockEmbed = typeof charity.givingBlockEmbedUrl === "string" && charity.givingBlockEmbedUrl.length > 0;

  useEffect(() => {
    if (!charity.givingBlockId && !charity.charityId) return;
    let cancelled = false;
    async function loadEvents() {
      setEventsLoading(true);
      try {
        const id = encodeURIComponent(String(charity.givingBlockId || charity.charityId));
        const res = await fetch(`/api/events/list?charityId=${id}&limit=5`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const js = await res.json();
        const arr = (js && js.results) || [];
        if (!cancelled) setEvents(arr);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }
    void loadEvents();
    return () => {
      cancelled = true;
    };
  }, [charity.givingBlockId, charity.charityId]);

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-700/30 via-emerald-900/40 to-black/95 p-4 sm:p-6 text-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.35)] overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-black/60 border border-emerald-500/40 flex items-center justify-center">
          {charity.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={charity.logo}
              alt={charity.name}
              className="max-h-40 max-w-full h-auto object-contain mx-auto"
              style={{ maxHeight: 160, maxWidth: "100%", height: "auto", objectFit: "contain" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-300/80">
              {charity.name.slice(0, 4).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-wide text-emerald-50 charity-safe-text" style={safeTextStyle}>{charity.name}</h1>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100 border border-emerald-400/70">
              Verified Nonprofit
            </span>
          </div>
          {charity.categories && charity.categories.length > 0 && (
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-emerald-300/80">
              {charity.categories.join(" • ")}
            </p>
          )}
        </div>
        {(hasDirectWallet || hasGivingBlockEmbed) && (
          <div className="flex flex-col gap-2 sm:items-end">
            {hasDirectWallet && (
              <button
                type="button"
                onClick={async () => {
                  const charityKey = String(charity.givingBlockId || charity.charityId || charity._id || '');
                  if (charityKey) {
                    try {
                      await fetch('/api/metrics', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ metric: 'charity_donate_click', charityId: charityKey }),
                      });
                    } catch {
                      // ignore metrics errors
                    }
                  }
                  setShowDonate(true);
                }}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow hover:from-emerald-300 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                Donate
              </button>
            )}
            {hasGivingBlockEmbed && (
              <a
                href={charity.givingBlockEmbedUrl as string}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100 hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                aria-label={`Open Giving Block donate widget for ${charity.name}`}
              >
                Donate via The Giving Block
              </a>
            )}
          </div>
        )}
      </div>

      {charity.description && (
        <div className="mt-4">
          <div
            className={`text-sm leading-relaxed text-emerald-50/90 charity-safe-text ${expanded ? '' : 'line-clamp-4 md:line-clamp-none'}`}
            id={`charity-desc-${String(charity._id || charity.charityId || charity.givingBlockId || charity.name)}`}
            dangerouslySetInnerHTML={{ __html: charity.description }}
            style={safeTextStyle}
          />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-[12px] font-semibold text-emerald-300/90"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {charity.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-500/40"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-4 border-t border-emerald-500/20 pt-4 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Official Links</h2>
          <ul className="mt-2 space-y-1 text-xs">
            {charity.website ? (
              <li>
                <a href={charity.website} target="_blank" rel="noreferrer" className="text-emerald-200 hover:text-emerald-100" aria-label={`Open website for ${charity.name}`}>
                  Visit Website
                </a>
              </li>
            ) : (
              <li>
                <span className="text-emerald-300/60 text-sm">Website not provided by charity</span>
              </li>
            )}
            {charity.socials?.twitter && (
              <li>
                <a
                  href={charity.socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 hover:text-emerald-100"
                  aria-label={`Open Twitter for ${charity.name}`}
                >
                  Twitter
                </a>
              </li>
            )}
            {charity.socials?.facebook && (
              <li>
                <a
                  href={charity.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 hover:text-emerald-100"
                  aria-label={`Open Facebook for ${charity.name}`}
                >
                  Facebook
                </a>
              </li>
            )}
            {charity.socials?.instagram && (
              <li>
                <a
                  href={charity.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 hover:text-emerald-100"
                  aria-label={`Open Instagram for ${charity.name}`}
                >
                  Instagram
                </a>
              </li>
            )}
            {charity.givingBlockEmbedUrl ? (
              <li>
                <a
                  href={charity.givingBlockEmbedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 hover:text-emerald-100"
                  aria-label={`Open Giving Block donate page for ${charity.name}`}
                >
                  Donate via Giving Block
                </a>
              </li>
            ) : (
              <li>
                <span className="text-emerald-300/60 text-sm">No public payment method provided</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Donation wallets</h2>
          {wallets.length === 0 ? (
            <div className="mt-2 text-sm text-emerald-300/70">No public wallets provided</div>
          ) : (
            <ul className="mt-2 space-y-1 text-[11px] text-emerald-100/80">
              {wallets.map((w) => {
                const explorer = explorerUrlFor(w.address, w.chain);
                return (
                  <li key={`${w.chain}:${w.address}`} className="break-all">
                    <span className="font-semibold uppercase tracking-[0.16em] text-emerald-300">{w.chain}:</span>{" "}
                    <span className="font-mono">{w.address}</span>
                    {explorer && (
                      <a
                        href={explorer}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90 underline-offset-2 hover:text-emerald-100 hover:underline"
                      >
                        View on explorer
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {(hasDirectWallet || hasGivingBlockEmbed) && (
        <p className="mt-4 text-[11px] text-emerald-100/75">
          Donations go directly to the charity&apos;s wallet.
          <br />
          Blockpage411 does not custody funds or provide refunds.
        </p>
      )}

      <p className="mt-3 text-xs text-emerald-300/60">Charity data provided by The Giving Block</p>

      <div className="mt-6 border-t border-emerald-500/20 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Linked events & fundraisers
        </h2>
        {eventsLoading ? (
          <p className="mt-2 text-[11px] text-emerald-100/80">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="mt-2 text-[11px] text-emerald-100/70">No active events found for this charity.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-emerald-100/90">
            {events.map((e) => (
              <li key={e._id || e.id} className="rounded-2xl border border-emerald-500/30 bg-black/50 px-3 py-2">
                <div className="font-semibold text-emerald-50">{e.title || e.name}</div>
                {e.description && (
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-emerald-100/80">
                    {e.description}
                  </div>
                )}
                {e.deadline && (
                  <div className="mt-1 text-[10px] text-emerald-200/80">
                    Ends: {new Date(e.deadline).toLocaleString()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasGivingBlockEmbed && (
        <div className="mt-6 border-t border-emerald-500/20 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Donate via The Giving Block
          </h2>
          <p className="mt-2 text-[11px] text-emerald-100/80">
            Use the official Giving Block donation widget below or open it in a new tab.
          </p>
          {isTrustedGivingBlockEmbed(charity.givingBlockEmbedUrl as string) ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/70">
              <iframe
                title={`givingblock-donate-${charity.givingBlockEmbedUrl}`}
                src={charity.givingBlockEmbedUrl}
                className="w-full h-[70vh] max-h-[520px] min-h-[360px]"
                style={{ border: "none" }}
                sandbox="allow-forms allow-scripts allow-popups"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-black/60 p-3 text-[11px] text-emerald-100/80">
              <p>
                The donation widget is hosted on an unverified domain and cannot be embedded here, but you can open it in a
                new tab:
              </p>
              <a
                href={charity.givingBlockEmbedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-emerald-400"
              >
                Open Giving Block widget
              </a>
            </div>
          )}
        </div>
      )}

      {showDonate && hasDirectWallet && (
        <DonateModal open={showDonate} onClose={() => setShowDonate(false)} charityName={charity.name} wallets={wallets} />
      )}
    </div>
  );
}
