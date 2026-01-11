"use client";
import React from "react";
import type { TrendingResponse } from "../../pages/api/trending";

type TrendingSectionProps = {
  title: string;
  subtitle?: string;
  items: React.ReactNode[];
  loading: boolean;
};

const CardSkeleton = () => (
  <div className="p-5 rounded-3xl bg-white/5 bg-opacity-5 backdrop-blur-2xl animate-pulse border border-white/5">
    <div className="h-6 bg-slate-700/60 rounded w-3/4 mb-3" />
    <div className="h-4 bg-slate-700/40 rounded w-1/2" />
  </div>
);

export function TrendingSection({ title, subtitle, items, loading }: TrendingSectionProps) {
  return (
    <section
      className="w-full max-w-6xl mx-auto mb-14"
      style={{ color: "#e6d6a7" }}
    >
      <header className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-slate-300/80 max-w-2xl">
            {subtitle}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : items.length > 0
          ? items
          : (
            <div className="col-span-full text-slate-400 text-sm py-6">
              Nothing trending here yet.
            </div>
            )}
      </div>
    </section>
  );
}

export type TrendingWalletCardProps = TrendingResponse["wallets"][number];
export function TrendingWalletCard({ address, chain, ens, riskScore, flagsCount, searchCount }: TrendingWalletCardProps) {
  const [open, setOpen] = React.useState(false);
  const displayLabel = ens || address;
  return (
    <div
      className="group relative p-5 rounded-3xl backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.88)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_70px_rgba(22,163,74,0.82)] border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-black/70 to-black"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left focus:outline-none"
        aria-expanded={open}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80 mb-2 flex items-center justify-between">
          <span>Wallet</span>
          <span className="text-[10px] text-emerald-200/70 flex items-center gap-1">
            {open ? 'Hide details' : 'View details'}
            <span className={`inline-block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </span>
        </p>
        <p className="text-base font-semibold break-all mb-1" style={{ color: 'var(--section-text, #fefce8)' }}>{displayLabel}</p>
        <p className="text-xs text-slate-400 mb-3">Chain: {chain}</p>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Risk score: {riskScore}</span>
          <span>Flags: {flagsCount}</span>
        </div>
        {typeof searchCount === 'number' && (
          <p className="mt-1 text-[11px] text-emerald-200/80">Searches: {searchCount}</p>
        )}
      </button>
      <div
        className={`mt-3 text-xs text-slate-200/90 overflow-hidden transition-all duration-200 ease-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-2 border-t border-emerald-500/20 flex flex-col gap-1">
          <p className="text-[11px] text-emerald-200/80">
            This wallet has <span className="font-semibold">{flagsCount}</span> moderation flags and a
            current risk score of <span className="font-semibold">{riskScore}</span>.
          </p>
          <p className="text-[11px] text-slate-300/90">
            Use the admin dashboard to inspect detailed flag history, reports, and associated campaigns
            for this address.
          </p>
        </div>
      </div>
    </div>
  );
}

export type TrendingCharityCardProps = TrendingResponse["charities"][number];
export function TrendingCharityCard({ name, logo, tags }: TrendingCharityCardProps) {
  return (
    <div
      className="group relative p-5 rounded-3xl backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.88)] transition-all duration-300 hover:-translate-y-1.5 border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-black/70 to-black"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80 mb-2">Charity</p>
      <p className="text-base font-semibold mb-2 charity-safe-text" style={{ color: 'var(--section-text, #fefce8)' }}>{name}</p>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="w-10 h-10 rounded-full object-contain mb-3" />
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-100/90">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export type TrendingEventCardProps = TrendingResponse["events"][number];
export function TrendingEventCard({ title, goalAmount, deadline }: TrendingEventCardProps) {
  const deadlineDate = deadline ? new Date(deadline) : null;
  const formattedDeadline = deadlineDate ? deadlineDate.toLocaleDateString() : "";
  return (
    <div
      className="group relative p-5 rounded-3xl backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.88)] transition-all duration-300 hover:-translate-y-1.5 border border-sky-400/25 bg-gradient-to-br from-sky-500/10 via-black/70 to-black"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80 mb-2">Fundraiser</p>
      <p className="text-base font-semibold mb-1" style={{ color: 'var(--section-text, #fefce8)' }}>{title}</p>
      <p className="text-xs text-slate-300 mb-2">Goal: {goalAmount?.toLocaleString()} USDC</p>
      {formattedDeadline && (
        <p className="text-xs text-slate-400">Deadline: {formattedDeadline}</p>
      )}
    </div>
  );
}
