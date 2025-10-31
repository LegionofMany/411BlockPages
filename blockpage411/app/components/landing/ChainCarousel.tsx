import Image from "next/image";

const chains = [
  { name: "Ethereum", src: "/logos/ethereum.png" },
  { name: "Polygon", src: "/logos/polygon.png" },
  { name: "BNB", src: "/logos/binance.png" },
  { name: "Solana", src: "/logos/solana.png" },
  { name: "Avalanche", src: "/logos/avalanche.png" },
  { name: "Bitcoin", src: "/logos/bitcoin.png" },
  { name: "Cardano", src: "/logos/cardano.png" },
  { name: "Tron", src: "/logos/tron.png" },
  { name: "XRP", src: "/logos/xrp.png" },
];

export default function ChainCarousel() {
  // make the total width of all items equal to the viewport width
  // logo size scales with the per-item viewport percentage, clamped between min and max
  // example: clamp(48px, calc(11.11vw * 0.55), 160px)
  // use a smaller scaling factor and tighter bounds so logos don't become too large
  // reduce overall container size but keep the logo visually prominent

  return (
    <section
      className="w-full py-8 sm:py-12 lg:py-16 px-4 sm:px-8 md:px-12"
      style={{ color: '#e6d6a7', position: 'relative', zIndex: 50, overflow: 'hidden' }}
    >
      <h2
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-10 bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, #fbbf24 0%, #fb923c 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Supported Chains
      </h2>

      <div className="w-full">
        {/* Responsive grid: auto-fit columns so items wrap and always remain visible */}
        <div
          className="grid gap-3 w-full"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))' }}
        >
          {chains.map((c) => (
            <div key={c.name} className="flex items-center justify-center p-2">
                <div
                  className="rounded-2xl flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105 w-full h-full"
                  style={{ padding: '0.375rem', backgroundColor: 'rgba(11,17,26,0.6)' }}
                >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    // relative sizing: logo container is a percentage of the parent item width
                    width: '60%',
                    height: '60%',
                    maxWidth: '72px',
                    aspectRatio: '1 / 1',
                    padding: '0.0625rem',
                    backgroundColor: 'rgba(11,17,26,0.72)'
                  }}
                >
                  <Image
                    src={c.src}
                    alt={c.name}
                    width={160}
                    height={160}
                    className="object-contain"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 10vw"
                  />
                </div>

                <span
                  className="mt-3 text-sm sm:text-base font-semibold text-center truncate"
                  style={{ color: '#e6d6a7' }}
                >
                  {c.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

