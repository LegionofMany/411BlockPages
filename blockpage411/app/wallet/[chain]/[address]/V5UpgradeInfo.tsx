import React from "react";

// Replaced the old v5 upgrade blurb with a professional promo header.
// This component intentionally uses inline styles to override any global layout
// rules so the header remains visually distinct and consistent across themes.
const ProfilePromo: React.FC = () => (
  <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', marginBottom: '1.5rem' }}>
    <header
      role="banner"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '18px',
        borderRadius: '12px',
        background: 'linear-gradient(90deg, rgba(6,10,27,0.7), rgba(10,16,36,0.6))',
        border: '1px solid rgba(99,102,241,0.12)',
        boxShadow: '0 8px 30px rgba(2,6,23,0.6)'
      }}
    >
      <h1 style={{
        margin: 0,
        color: '#E6F3F1',
        fontSize: '1.4rem',
        lineHeight: 1.2,
        fontWeight: 700,
        letterSpacing: '-0.01em'
      }}>
        Blockpage411 — Wallet intelligence and trust insights
      </h1>
      <p style={{ margin: 0, color: '#A7BBC1', fontSize: '0.95rem' }}>
        Fast, clear risk scores and community signals for on-chain addresses — built for researchers, exchanges and compliance teams.
      </p>
    </header>
  </div>
);

export default ProfilePromo;
