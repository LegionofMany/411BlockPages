"use client";
import Image from 'next/image';

const testimonials = [
  { name: 'Alice', quote: 'Blockpage411 saved me from interacting with a scammer — accurate and fast.', avatar: '/logos/ethereum.png' },
  { name: 'Exchange Team', quote: 'A valuable tool for on-chain risk review and compliance workflows.', avatar: '/logos/binance.png' },
  { name: 'Bob', quote: 'I trust the community ratings when I accept payments.', avatar: '/logos/polygon.png' },
];

export default function Testimonials() {
  return (
    <section className="w-full max-w-6xl mx-auto text-center py-16 px-4">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent" style={{
        backgroundImage: 'linear-gradient(90deg, rgba(255,223,99,0.98) 0%, rgba(245,158,11,0.95) 60%)'
      }}>
        Trusted by the Community
      </h2>
      <p className="mb-12 max-w-2xl mx-auto" style={{
        color: 'rgba(255, 223, 99, 0.92)',
        background: 'linear-gradient(90deg, rgba(255,223,99,0.04), rgba(255,223,99,0.01))',
        padding: '0.35rem 0.9rem',
        borderRadius: 10,
        backdropFilter: 'blur(6px)'
      }}>
        Used by wallet owners, auditors, and public goods contributors to navigate Web3 with confidence. These stories highlight how Blockpage411 surfaces meaningful signals, accelerates investigations, and builds trust across chains.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t) => (
          <div key={t.name} className="p-6 bg-[rgba(8,12,20,0.46)] backdrop-blur-lg rounded-2xl shadow-lg text-left" style={{ border: '1px solid rgba(10,40,90,0.7)' }}>
            <div className="flex items-center gap-4 mb-4">
              <Image src={t.avatar} alt={t.name} width={56} height={56} className="rounded-full" />
              <div>
                <div className="font-bold" style={{ color: 'rgba(255,223,99,0.98)' }}>{t.name}</div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,215,90,0.98)', lineHeight: 1.6 }}>&quot;{t.quote}&quot;</p>
          </div>
        ))}
      </div>
    </section>
  );
}
