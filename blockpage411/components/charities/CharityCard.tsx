"use client";

import React from "react";
import Link from "next/link";

export interface CharitySummary {
  _id?: string;
  givingBlockId?: string;
  charityId?: string;
  name: string;
  description?: string;
  logo?: string;
  tags?: string[];
  categories?: string[];
}

interface Props {
  charity: CharitySummary;
}

export default function CharityCard({ charity }: Props) {
  const id = charity.givingBlockId || charity.charityId || charity._id || charity.name;
  const href = `/charities/${encodeURIComponent(String(id))}`;

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/25 via-emerald-900/40 to-black/90 p-4 transition-transform duration-200 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.45)]"
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/40 border border-emerald-500/30">
          {charity.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={charity.logo} alt={charity.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-emerald-300/80">
              {charity.name.slice(0, 3).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-wide text-emerald-100">
            {charity.name}
          </h3>
          {charity.categories && charity.categories.length > 0 && (
            <p className="mt-0.5 line-clamp-1 text-[11px] uppercase tracking-[0.16em] text-emerald-300/70">
              {charity.categories.join(" • ")}
            </p>
          )}
          {charity.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-snug text-emerald-50/90">
              {charity.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {charity.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-500/40"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
