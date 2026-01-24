"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import NavLinkItem from './NavLinkItem';
import { ConnectWalletButton } from './ConnectWalletButton';
import { useEvmWallet } from '../../components/EvmWalletProvider';
import WalletSearchBar from './WalletSearchBar';
import {
  IconHome, IconSearch, IconFund, IconDonate, IconTrending,
  IconAdmin, IconActions, IconSignIn, IconMenuSpecial, IconPhoneBook
} from './NavbarIcons';

// Icon and NavLinkItem extracted to separate modules (NavbarIcons.tsx and NavLinkItem.tsx)

// variant is accepted for future visual variants but currently unused
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export default function Navbar({ variant: _variant }: { variant?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  const [nftAvatarUrl, setNftAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { disconnect } = useEvmWallet();
  // call hook unconditionally to satisfy rules-of-hooks
  const pathname = usePathname() || '';

  // Close the mobile menu on navigation so it can't trap pointer events on #content.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // navigation items - include all top-level routes and a couple useful legacy/admin links
  const navItems: Array<{ href: string; label: string; Icon?: React.FC; show?: boolean }> = [
    { href: '/', label: 'Home', Icon: IconHome },
    { href: '/wallet-analysis', label: 'Wallet Analysis', Icon: IconSearch },
    { href: '/phone-book', label: 'Phone Book', Icon: IconPhoneBook },
    { href: '/charities', label: 'Charities', Icon: IconFund },
    { href: '/fundraisers', label: 'Fundraisers', Icon: IconFund },
    { href: '/transactions/live', label: 'Live Feed', Icon: IconTrending },
    { href: '/profile', label: 'Profile', Icon: IconSignIn },
    { href: '/donate', label: 'Donate', Icon: IconDonate },
    { href: '/trending', label: 'Trending', Icon: IconTrending },
    // admin links rendered conditionally once we know the user is admin
    { href: '/admin', label: 'Admin', Icon: IconAdmin, show: isAdmin },
    // legacy/utility pages
    { href: '/admin-actions', label: 'Admin Actions', Icon: IconActions, show: isAdmin },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href);
  };

  // focus trap and accessibility for mobile drawer
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const prevActiveRef = React.useRef<Element | null>(null);

  React.useEffect(() => {
    if (!open) return;
    prevActiveRef.current = document.activeElement;
    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>("a, button, [tabindex]:not([tabindex='-1'])");
    focusable?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function onClickOutside(e: MouseEvent) {
      const el = drawerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);

    // mark main content as aria-hidden for screen readers while popup is open
    const main = document.getElementById('content');
    if (main) {
      main.setAttribute('aria-hidden', 'true');
      // also make the main content non-interactive so it cannot overlap or accept clicks
      (main as HTMLElement).style.pointerEvents = 'none';
      (main as HTMLElement).style.userSelect = 'none';
      (main as HTMLElement).style.touchAction = 'none';
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
      if (main) {
        main.removeAttribute('aria-hidden');
        (main as HTMLElement).style.pointerEvents = '';
        (main as HTMLElement).style.userSelect = '';
        (main as HTMLElement).style.touchAction = '';
      }
      try { (prevActiveRef.current as HTMLElement)?.focus(); } catch {}
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const statusRes = await fetch('/api/auth/status', { credentials: 'include', cache: 'no-store' });
        const status = await statusRes.json().catch(() => ({} as any));
        if (!status?.authenticated) {
          if (!cancelled) {
            setIsAdmin(false);
            setIsAuthenticated(false);
            setNftAvatarUrl(null);
          }
          return;
        }

        // IMPORTANT: show authenticated state as soon as we know the cookie is valid.
        // `/api/me` can fail if MongoDB is down; we still want Sign out visible so
        // users can log out and the UI doesn't get stuck.
        if (!cancelled) {
          setIsAuthenticated(true);
        }

        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            // Keep isAuthenticated=true (cookie is valid), but clear profile-derived UI.
            setIsAdmin(false);
            setNftAvatarUrl(null);
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.nftAvatarUrl) setNftAvatarUrl(data.nftAvatarUrl);
        const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
          .split(',')
          .map((w) => w.trim().toLowerCase())
          .filter(Boolean);

        const address: string | undefined = data?.address || data?.wallet || data?.user?.address;

        const hasAdminFlag = data?.isAdmin === true || data?.admin === true || data?.role === 'admin';
        const isAddressAdmin = !!(address && envAdmins.length && envAdmins.includes(address.toLowerCase()));

        setIsAdmin(Boolean(hasAdminFlag || isAddressAdmin));
      } catch {
        // ignore
        setIsAuthenticated(false);
        setIsAdmin(false);
        setNftAvatarUrl(null);
      }
    }

    function onAuthChanged() {
      loadMe();
    }

    loadMe();
    window.addEventListener('auth-changed', onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, [pathname]);

  // NavLinkItem is imported from ./NavLinkItem to keep markup consistent across desktop+mobile

  return (
    <>
      <nav role="navigation" aria-label="Main" className="site-nav w-full flex items-center justify-between px-4 md:px-8 py-3" style={{ backgroundColor: '#070812' }}>
        <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 focus:outline-none" aria-label="Go to homepage">
            <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={36} height={36} priority />
            <span className="text-lg md:text-xl font-semibold" style={{ color: "#ffffff" }}>Blockpage411</span>
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          <ul className="flex gap-6 items-center list-none m-0 p-0">
            {navItems.map((item) => {
              if (item.show === false) return null;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <NavLinkItem href={item.href} label={item.label} Icon={item.Icon} active={active} />
                </li>
              );
            })}
          </ul>

			<div className="w-[22rem] max-w-[28vw]">
				<WalletSearchBar size="sm" />
			</div>
          <ConnectWalletButton />
          {/* Sign in / Sign out */}
          <div>
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
                  } catch {}
                  try {
                    await disconnect();
                  } catch {}
                  try {
                    window.localStorage.removeItem('wallet');
                  } catch {}
                  try {
                    window.dispatchEvent(new Event('auth-changed'));
                  } catch {}
                  try {
                    window.location.href = '/';
                  } catch {
                    // ignore
                  }
                }}
                className="nav-link inline-flex items-center gap-2 px-2 py-1 rounded transition ml-4"
                aria-label="Sign out"
              >
                <IconSignIn />
                <span className="text-sm md:text-base font-medium">Sign out</span>
              </button>
            ) : (
              <NavLinkItem href="/login" label="Sign in" Icon={IconSignIn} />
            )}
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              className="group relative inline-flex items-center gap-2 rounded-full px-3 py-1 border border-lime-300/80 bg-lime-400/20 hover:bg-lime-400/30 transition-colors shadow-[0_0_18px_rgba(190,242,100,0.55)]"
              aria-label="Open admin dashboard"
              title="Admin mode  in progress"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/30 text-[11px] font-semibold text-emerald-200">
                A
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200 group-hover:text-lime-50">
                Admin
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-[1300] -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-md bg-black/95 px-3 py-1.5 text-[11px] font-medium text-lime-200 opacity-0 shadow-xl ring-1 ring-lime-300/60 transition-opacity group-hover:opacity-100 flex items-center gap-1.5">
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-lime-400/40 text-[9px] text-black">
                  ✓
                </span>
                <span>Admin mode ��� in progress</span>
              </span>
            </Link>
          )}
          <Link
            href="/profile"
            className="group inline-flex items-center gap-2 rounded-full px-1.5 py-1 border border-emerald-400/40 bg-black/30 hover:bg-emerald-500/10 transition-colors"
            aria-label="Open profile"
          >
            <div
              className="relative rounded-full overflow-hidden flex-shrink-0"
              style={{ width: '2.1rem', height: '2.1rem', background: 'radial-gradient(circle at 30% 0%, rgba(34,197,94,0.75), rgba(2,6,23,1))' }}
            >
              {nftAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nftAvatarUrl} alt="My NFT avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg" aria-hidden="true">📸</div>
              )}
            </div>
            <span className="pr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200 group-hover:text-amber-100">
              My NFT
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-1 mr-1"
              aria-label="Open admin dashboard"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                Admin
              </span>
            </Link>
          )}
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/35 bg-black/40 p-1.5"
            aria-label="Open profile"
          >
            <div
              className="relative rounded-full overflow-hidden flex-shrink-0"
              style={{ width: '1.9rem', height: '1.9rem', background: 'radial-gradient(circle at 30% 0%, rgba(34,197,94,0.75), rgba(2,6,23,1))' }}
            >
              {nftAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nftAvatarUrl} alt="My NFT avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base" aria-hidden="true">📸</div>
              )}
            </div>
          </Link>
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => { setBtnHover(false); setBtnPressed(false); }}
            onMouseDown={() => setBtnPressed(true)}
            onMouseUp={() => setBtnPressed(false)}
            className={`p-2 rounded-lg focus:outline-none transition-all duration-180 inline-flex items-center justify-center ${open ? 'bg-gradient-to-br from-amber-400/16 to-violet-500/14 ring-2 ring-amber-300/40 scale-105' : btnHover ? 'bg-white/6 ring-1 ring-white/10' : 'hover:bg-white/3'}`}
            style={{ transform: btnPressed ? 'scale(0.96) translateY(1px)' : undefined }}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className={`inline-block transform transition-transform duration-220 ${open ? 'rotate-12' : btnHover ? 'rotate-4' : ''}` }>
              <IconMenuSpecial state={open ? 'open' : btnHover ? 'hover' : 'default'} />
            </span>
          </button>
        </div>

        {/* Mobile dropdown card-style popup (anchored under navbar) rendered into a portal to avoid stacking context issues */}
        {open && typeof document !== 'undefined' ? createPortal(
          <>
            {/* full-screen overlay to dim and block interactions beneath the popup */}
            <div
              onClick={() => setOpen(false)}
              aria-hidden="true"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2,6,23,0.28)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 1200
              }}
            />

            {/* popup card - fixed so it sits above all page content */}
            <div style={{ position: 'fixed', right: 16, top: 64, zIndex: 1250 }}>
              <div
                id="mobile-drawer"
                ref={drawerRef}
                role="menu"
                aria-label="Mobile navigation"
                className="w-64 sm:w-80 rounded-2xl overflow-visible"
                style={{
                  // stronger, higher-contrast background for readability
                  background: 'linear-gradient(135deg, rgba(8,10,18,0.92) 0%, rgba(6,8,15,0.96) 100%)',
                  backdropFilter: 'blur(6px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(6px) saturate(120%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 12px 48px rgba(2,6,23,0.72)',
                  animation: 'scaleIn 160ms ease',
                  overflow: 'hidden'
                }}
              >
                {/* caret */}
                <div style={{ position: 'absolute', right: 28, top: -9, width: 18, height: 18, transform: 'rotate(45deg)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', borderLeft: '1px solid rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.02)' }} />
                <div className="p-4 flex items-center justify-between">
                  <div className="text-lg font-semibold text-slate-100">Navigation</div>
                  <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 rounded-md focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-4 pb-3">
                  <WalletSearchBar size="sm" />
                </div>
                <nav className="px-4 py-3" role="menu">
                  <ul className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      item.show === false ? null : (
                        <li key={item.href}>
                          <NavLinkItem href={item.href} label={item.label} Icon={item.Icon} onClick={() => setOpen(false)} mobile />
                        </li>
                      )
                    ))}
                    <li>
                      {isAuthenticated ? (
                        <button
                          onClick={async () => {
                            try {
                              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', cache: 'no-store' });
                            } catch {}
                            try {
                              await disconnect();
                            } catch {}
                            try {
                              window.localStorage.removeItem('wallet');
                            } catch {}
                            try {
                              window.dispatchEvent(new Event('auth-changed'));
                            } catch {}
                            try {
                              setOpen(false);
                            } catch {}
                            try {
                              window.location.href = '/';
                            } catch {}
                          }}
                          className="w-full text-left nav-link-mobile"
                        >
                          Sign out
                        </button>
                      ) : (
                        <NavLinkItem href="/login" label="Sign in" Icon={IconSignIn} onClick={() => setOpen(false)} mobile />
                      )}
                    </li>
                  </ul>
                </nav>
              </div>
              <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
            </div>
          </>,
          document.body
        ) : null}
      </nav>
    <style jsx>{`
    .site-nav { position: fixed; top:0; left:0; right:0; z-index:1100; }
    .site-nav {
      background: linear-gradient(90deg, rgba(6,8,15,0.95) 0%, rgba(10,12,20,0.98) 100%);
      background-color: rgba(6,8,15,0.98);
      box-shadow: 0 6px 40px rgba(2,6,23,0.6);
      backdrop-filter: blur(8px) saturate(120%);
      -webkit-backdrop-filter: blur(8px) saturate(120%);
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    /* Scoped selectors to ensure global .nav-link in globals.css doesn't override our navbar styles */
    .site-nav .nav-link { color: var(--link-color, #fbbf24); }
    .site-nav .nav-link[data-active="true"] { --link-color: #f59e0b; }
    .site-nav .nav-link[data-active="false"] { --link-color: #fbbf24; }
    .site-nav .nav-link:hover { color: #fcd34d; transform: translateY(-3px); }
    .site-nav .nav-link svg, .site-nav .nav-link-mobile svg { color: inherit; }
    .site-nav .nav-link-mobile {
      color: #facc15;
      font-weight: 600;
      border-radius: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: linear-gradient(135deg, rgba(250,204,21,0.12), rgba(248,250,252,0.02));
      box-shadow: 0 10px 28px rgba(15,23,42,0.85);
      backdrop-filter: blur(10px) saturate(130%);
      -webkit-backdrop-filter: blur(10px) saturate(130%);
      border: 1px solid rgba(250,204,21,0.35);
    }
    .site-nav .nav-link-mobile:hover {
      color: #fef9c3;
      background: linear-gradient(135deg, rgba(250,204,21,0.22), rgba(248,250,252,0.06));
      box-shadow: 0 14px 38px rgba(15,23,42,0.95);
      transform: translateY(-1px);
    }
        `}</style>
    </>
  );
}
