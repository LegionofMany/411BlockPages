"use client";
import Link from 'next/link';
import React from 'react';

export default function NavLinkItem({ href, label, Icon, onClick, active, mobile }: {
  href: string; label: string; Icon?: React.FC; onClick?: () => void; active?: boolean; mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-active={!!active}
      className={mobile ? 'nav-link-mobile block px-3 py-2 rounded flex items-center gap-3 transition hover:bg-white/8 active:scale-95' : 'nav-link inline-flex items-center gap-2 px-2 py-1 rounded transition'}
    >
      {Icon ? <Icon /> : null}
      <span className={mobile ? 'font-medium text-amber-300' : 'text-sm md:text-base font-medium'}>{label}</span>
    </Link>
  );
}
