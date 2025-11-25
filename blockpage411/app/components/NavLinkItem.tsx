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
      className={
        mobile
          ? 'nav-link-mobile block flex items-center gap-3 transition active:scale-95'
          : 'nav-link inline-flex items-center gap-2 px-2 py-1 rounded transition'
      }
      style={
        mobile
          ? {
              color: '#facc15',
              borderRadius: '0.75rem',
              padding: '0.5rem 0.75rem',
              background:
                'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(248,250,252,0.02))',
              boxShadow: '0 10px 28px rgba(15,23,42,0.85)',
              backdropFilter: 'blur(10px) saturate(130%)',
              WebkitBackdropFilter: 'blur(10px) saturate(130%)',
              border: '1px solid rgba(250,204,21,0.35)',
            }
          : undefined
      }
    >
      {Icon ? <Icon /> : null}
      <span className={mobile ? 'font-medium' : 'text-sm md:text-base font-medium'}>{label}</span>
    </Link>
  );
}
