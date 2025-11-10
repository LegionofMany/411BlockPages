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
    <section className="w-full max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#e6d6a7' }}>How it works</h2>
      <div className="space-y-3">
        {faq.map((f, i) => (
          <div key={i} className="card p-4 rounded-2xl">
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
