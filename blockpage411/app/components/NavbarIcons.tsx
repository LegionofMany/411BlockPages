import React from 'react';

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center w-5 h-5">{children}</span>
);

export const IconHome = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21V12h14v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

export const IconSearch = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

export const IconFund = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

export const IconDonate = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 12a8 8 0 1 0-16 0c0 4 4 7 8 11 4-4 8-7 8-11z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.12" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

export const IconTrending = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

export const IconAdmin = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 2l3 6 6 .5-4.5 3.5L19 20l-7-4-7 4 1.5-8-4.5-3.5L9 8 12 2z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.08" />
    </svg>
  </Icon>
);

export const IconActions = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </Icon>
);

export const IconSignIn = () => (
  <Icon>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 3h4a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 17L15 12 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Icon>
);

export const IconMenuSpecial = ({ state = 'default' }: { state?: 'default' | 'hover' | 'open' }) => {
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

export default Icon;
