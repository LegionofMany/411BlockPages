"use client";
import Image from 'next/image';

export default function Testimonials() {
  const logos = [
    '/logos/ethereum.png',
    '/logos/bitcoin.png',
    '/logos/polygon.png',
    '/logos/avalanche.png',
  ];

  return (
    <section className="w-full max-w-6xl mx-auto text-center py-12">
      <div className="glass p-6 rounded-lg mb-6">
        <h3 className="text-xl md:text-2xl font-semibold mb-3">Trusted by the community</h3>
        <p className="muted mb-4">Used by wallet owners, auditors, and public goods contributors.</p>
        <div className="flex items-center justify-center gap-6 flex-wrap mb-3">
          {logos.map((src) => (
            <div key={src} className="w-16 h-10 opacity-90">
              <Image src={src} alt="logo" width={64} height={40} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <blockquote className="p-4 glass rounded">
            <p className="text-sm muted">&quot;A fast way to check wallet reputations. Helped our audit team prioritize investigations.&quot;</p>
            <cite className="text-xs mt-2 block">— Audit Team</cite>
          </blockquote>
          <blockquote className="p-4 glass rounded">
            <p className="text-sm muted">&quot;Nice UX and clear flags. Great for onboarding donors.&quot;</p>
            <cite className="text-xs mt-2 block">— Organizer</cite>
          </blockquote>
          <blockquote className="p-4 glass rounded">
            <p className="text-sm muted">&quot;Excellent visibility into on-chain activity and trust signals.&quot;</p>
            <cite className="text-xs mt-2 block">— Researcher</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
