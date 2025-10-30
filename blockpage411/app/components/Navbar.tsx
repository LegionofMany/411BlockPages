"use client";
import React, { useState } from "react";
import { createPortal } from 'react-dom';
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Small inline SVG icons to avoid external icon dependency and keep bundle predictable
const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center w-5 h-5">{children}</span>
);

const IconHome = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21V12h14v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const IconSearch = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const IconFund = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const IconDonate = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 12a8 8 0 1 0-16 0c0 4 4 7 8 11 4-4 8-7 8-11z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.12" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const IconTrending = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const IconAdmin = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 2l3 6 6 .5-4.5 3.5L19 20l-7-4-7 4 1.5-8-4.5-3.5L9 8 12 2z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.08" />
    </svg>
  </Icon>
);

const IconActions = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </Icon>
);

const IconSignIn = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 3h4a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 17L15 12 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

const IconMenuSpecial = ({ state = 'default' }: { state?: 'default' | 'hover' | 'open' }) => {
  // change gradient stops and small rotation/glow based on state
  const id = `g1-${state}`;
  const stops = state === 'hover' ? ['#ffe08a', '#ff8a00'] : state === 'open' ? ['#7c3aed', '#ffb86b'] : ['#ffb86b', '#7c3aed'];
  const transform = state === 'open' ? 'rotate(10deg)' : state === 'hover' ? 'rotate(4deg)' : 'none';
  const glow = state === 'hover' ? 'drop-shadow(0 6px 14px rgba(255,138,0,0.14))' : state === 'open' ? 'drop-shadow(0 8px 28px rgba(124,58,237,0.12))' : 'none';
  return (
    <span className="inline-flex items-center justify-center w-6 h-6" style={{ transform, filter: glow }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" x2="1">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="100%" stopColor={stops[1]} />
          </linearGradient>
        </defs>
        <path d="M12 2l2.6 5.2L20 10l-4 3 1 6L12 16l-5 3 1-6L4 10l5.4-2.8L12 2z" fill={`url(#${id})`} opacity="0.98" />
      </svg>
    </span>
  );
};

export default function Navbar({ variant: _variant }: { variant?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  // call hook unconditionally to satisfy rules-of-hooks
  const pathname = usePathname() || '';
      // navigation items - include all top-level routes and a couple useful legacy/admin links
      const navItems: Array<{ href: string; label: string; Icon?: React.FC; show?: boolean }> = [
        { href: '/', label: 'Home', Icon: IconHome },
        { href: '/search', label: 'Search', Icon: IconSearch },
        { href: '/fundraisers', label: 'Fundraisers', Icon: IconFund },
        { href: '/donate', label: 'Donate', Icon: IconDonate },
        { href: '/wallet/popular', label: 'Trending', Icon: IconTrending },
        { href: '/admin', label: 'Admin', Icon: IconAdmin },
        // legacy/utility pages
        { href: '/admin-actions', label: 'Admin Actions', Icon: IconActions },
        { href: '/login', label: 'Sign in', Icon: IconSignIn },
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

      return (
        <>
          <nav
            role="navigation"
            aria-label="Main"
            className="w-full flex items-center justify-between px-4 md:px-8 py-3"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              // glassmorphism: translucent gradient with blur and subtle border
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(124,58,237,0.06) 50%, rgba(2,6,23,0.18) 100%)',
              backgroundColor: 'rgba(6,8,15,0.42)',
              boxShadow: '0 6px 30px rgba(2,6,23,0.45)',
              zIndex: 2147483647,
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)',
              borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}
          >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 focus:outline-none" aria-label="Go to homepage">
            <Image src="/block411-logo.svg" alt="Blockpage411 Logo" width={36} height={36} />
            <span className="text-lg md:text-xl font-semibold">Blockpage411</span>
          </Link>
        </div>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-6 items-center list-none m-0 p-0">
          {navItems.map((item) => {
            if (item.show === false) return null;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-sm md:text-base font-medium focus:outline-none rounded inline-flex items-center gap-2 px-2 py-1 transition transform duration-150 ease-in-out ${active ? 'text-amber-300' : 'text-white'} hover:text-amber-300 hover:-translate-y-1 active:scale-95 focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-transparent`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.Icon ? <item.Icon /> : null}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
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
                zIndex: 2147483649
              }}
            />

            {/* popup card - fixed so it sits above all page content */}
            <div style={{ position: 'fixed', right: 16, top: 64, zIndex: 2147483650 }}>
              <div
                id="mobile-drawer"
                ref={drawerRef}
                role="menu"
                aria-label="Mobile navigation"
                className="w-64 sm:w-80 rounded-2xl overflow-visible"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,245,210,0.08) 0%, rgba(255,235,160,0.05) 40%, rgba(6,8,15,0.56) 100%)',
                  backdropFilter: 'blur(10px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                  border: '1px solid rgba(59,130,246,0.18)',
                  boxShadow: '0 10px 40px rgba(2,6,23,0.6)',
                  animation: 'scaleIn 160ms ease',
                  overflow: 'hidden'
                }}
              >
                {/* caret */}
                <div style={{ position: 'absolute', right: 28, top: -9, width: 18, height: 18, transform: 'rotate(45deg)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', borderLeft: '1px solid rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.02)' }} />
                <div className="p-4 flex items-center justify-between">
                  <div className="text-lg font-semibold">Navigation</div>
                  <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 rounded-md focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="px-4 py-2" role="menu">
                  <ul className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      item.show === false ? null : (
                        <li key={item.href}>
                          <Link href={item.href} className="block px-3 py-2 text-sm focus:outline-none rounded flex items-center gap-3 transition hover:bg-white/3 active:scale-95" onClick={() => setOpen(false)}>
                            {item.Icon ? <item.Icon /> : null}
                            <span className="font-medium text-white">{item.label}</span>
                          </Link>
                        </li>
                      )
                    ))}
                  </ul>
                </nav>
              </div>
              <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
            </div>
          </>,
          document.body
        ) : null}
      </nav>
    </>
  );
}
