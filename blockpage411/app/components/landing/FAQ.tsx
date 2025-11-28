"use client";
import { useState } from 'react';

const faq = [
  { q: 'How does Blockpage411 determine risk?', a: 'We combine on-chain heuristics, community ratings, and curated provider signals to compute a risk score.' },
  { q: 'Which blockchains are supported?', a: 'Ethereum, Polygon, BNB, Solana, Bitcoin, and several others. More are added regularly.' },
  { q: 'Can I claim my wallet?', a: 'Yes — you can claim and verify ownership of a wallet to receive a verified badge.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12" style={{ maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#e5e7eb' }}>How it works</h2>
      <div className="space-y-3">
        {faq.map((f, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl"
            style={{
              background:
                "radial-gradient(circle at top, rgba(34,197,94,0.1), transparent 55%), radial-gradient(circle at bottom right, rgba(56,189,248,0.12), transparent 60%), rgba(0,0,0,0.9)",
              boxShadow: "0 22px 64px rgba(0,0,0,0.95)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "none",
            }}
          >
            <button className="w-full text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <div className="flex justify-between items-center">
                <div className="font-semibold">{f.q}</div>
                <div>{open === i ? '−' : '+'}</div>
              </div>
            </button>
            {open === i && <div className="mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
