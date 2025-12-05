"use client";

import React, { useEffect, useState } from "react";
import DonateModal, { CharityWallet } from "./DonateModal";

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

  const wallets: CharityWallet[] =
    charity.wallets ||
    (charity.donationAddress
      ? [{ chain: "ethereum", address: charity.donationAddress, label: "Main" }]
      : charity.wallet
      ? [{ chain: "ethereum", address: charity.wallet, label: "Main" }]
      : []);

  useEffect(() => {
    if (!charity.givingBlockId && !charity.charityId) return;
    let cancelled = false;
    async function loadEvents() {
      setEventsLoading(true);
      try {
        const id = encodeURIComponent(String(charity.givingBlockId || charity.charityId));
        const res = await fetch(`/api/events/list?charityId=${id}&activeOnly=true&limit=5`);
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

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-700/30 via-emerald-900/40 to-black/95 p-6 text-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-black/60 border border-emerald-500/40">
          {charity.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={charity.logo} alt={charity.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-300/80">
              {charity.name.slice(0, 4).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-wide text-emerald-50">{charity.name}</h1>
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
        {wallets.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDonate(true)}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow hover:from-emerald-300 hover:to-emerald-500"
          >
            Donate
          </button>
        )}
      </div>

      {charity.description && (
        <p className="mt-4 text-sm leading-relaxed text-emerald-50/90">{charity.description}</p>
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
            {charity.website && (
              <li>
                <a href={charity.website} target="_blank" rel="noreferrer" className="text-emerald-200 hover:text-emerald-100">
                  Website
                </a>
              </li>
            )}
            {charity.socials?.twitter && (
              <li>
                <a
                  href={charity.socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 hover:text-emerald-100"
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
                >
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>

        {wallets.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Donation wallets</h2>
            <ul className="mt-2 space-y-1 text-[11px] text-emerald-100/80">
              {wallets.map((w) => (
                <li key={`${w.chain}:${w.address}`} className="break-all">
                  <span className="font-semibold uppercase tracking-[0.16em] text-emerald-300">{w.chain}:</span>{" "}
                  <span className="font-mono">{w.address}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

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

      {showDonate && wallets.length > 0 && (
        <DonateModal open={showDonate} onClose={() => setShowDonate(false)} charityName={charity.name} wallets={wallets} />
      )}
    </div>
  );
}
