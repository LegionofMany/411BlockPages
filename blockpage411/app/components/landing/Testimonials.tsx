"use client";
import Image from 'next/image';
import { motion } from 'framer-motion';

const testimonials = [
  { name: 'Alice', quote: 'Blockpage411 saved me from interacting with a scammer — accurate and fast.', avatar: '/logos/ethereum.png' },
  { name: 'Exchange Team', quote: 'A valuable tool for on-chain risk review and compliance workflows.', avatar: '/logos/binance.png' },
  { name: 'Bob', quote: 'I trust the community ratings when I accept payments.', avatar: '/logos/polygon.png' },
];

export default function Testimonials() {
  return (
    <section className="w-full max-w-6xl mx-auto text-center py-16 px-4">
      <h2
        className="text-3xl md:text-4xl font-bold mb-4"
        style={{ color: '#e5e7eb' }}
      >
        Trusted by the Community
      </h2>
      <p
        className="mb-12 max-w-2xl mx-auto"
        style={{ color: 'var(--muted-text)' }}
      >
        Used by wallet owners, auditors, and public goods contributors to navigate Web3 with confidence. These stories highlight how Blockpage411 surfaces meaningful signals, accelerates investigations, and builds trust across chains.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t) => (
          <motion.div
            key={t.name}
            className="p-6 rounded-2xl text-left"
            whileHover={{ translateY: -6 }}
            style={{
              background:
                "radial-gradient(circle at top, rgba(34,197,94,0.1), transparent 55%), radial-gradient(circle at bottom right, rgba(56,189,248,0.12), transparent 60%), rgba(0,0,0,0.9)",
              boxShadow: "0 22px 64px rgba(0,0,0,0.95)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "none",
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Image src={t.avatar} alt={t.name} width={56} height={56} className="rounded-full" />
              <div>
                <div className="font-bold" style={{ color: 'rgba(255,223,99,0.98)' }}>{t.name}</div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,215,90,0.98)', lineHeight: 1.6 }}>&quot;{t.quote}&quot;</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
