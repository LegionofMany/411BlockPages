"use client";
import Image from "next/image";

export default function TrustBadges() {
  const badges = [
    { alt: 'Ethereum', src: '/logos/ethereum.png' },
    { alt: 'Binance', src: '/logos/binance.png' },
    { alt: 'Polygon', src: '/logos/polygon.png' },
    { alt: 'Bitcoin', src: '/logos/bitcoin.png' },
  ];

  return (
    <section aria-label="Trust badges" className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm font-semibold mb-3" style={{ color: '#e6d6a7' }}>As seen on</p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {badges.map((b) => (
            <div key={b.alt} className="flex items-center justify-center p-2" style={{ width: 120 }}>
              <Image src={b.src} alt={b.alt} width={96} height={36} style={{ objectFit: 'contain' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
