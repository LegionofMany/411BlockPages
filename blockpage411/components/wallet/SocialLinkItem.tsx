"use client";
import React from 'react';

type SocialLinkItemProps = {
  label: string;
  placeholder: string;
  value: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
};

export default function SocialLinkItem({ label, placeholder, value, icon, onChange }: SocialLinkItemProps) {
  return (
    <label className="flex flex-col text-[11px] text-amber-100/80">
      <span className="mb-1 inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.16em]">
        {icon}
        <span>{label}</span>
      </span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-full border border-emerald-500/40 bg-black/70 px-3 text-[11px] text-amber-50 placeholder:text-emerald-400/60 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 transition"
      />
    </label>
  );
}
