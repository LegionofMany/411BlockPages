import Image from "next/image";

type Chain = {
  name: string;
  src: string;
  soon?: boolean;
};

const chains: Chain[] = [
  { name: "Ethereum", src: "/logos/ethereum.png" },
  { name: "Polygon", src: "/logos/polygon.png" },
  { name: "BNB Chain", src: "/logos/binance.png" },
  { name: "Solana", src: "/logos/solana.png" },
  { name: "Avalanche", src: "/logos/avalanche.png" },
  { name: "Bitcoin", src: "/logos/bitcoin.png" },
  { name: "Cardano", src: "/logos/cardano.png" },
  { name: "Tron", src: "/logos/tron.png" },
  { name: "XRP", src: "/logos/xrp.png" },
  // roadmap / upcoming networks
  { name: "Base", src: "/logos/base.png", soon: true },
  { name: "Arbitrum", src: "/logos/arbitrum.png", soon: true },
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
      style={{ color: '#e6d6a7', position: 'relative', zIndex: 50, overflow: 'hidden', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}
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

                <div className="mt-3 flex flex-col items-center gap-1 min-h-[2.25rem]">
                  <span
                    className="text-xs sm:text-sm font-semibold text-center truncate px-1"
                    style={{ color: "#e6d6a7" }}
                  >
                    {c.name}
                  </span>
                  {c.soon && (
                    <span
                      className="inline-flex items-center justify-center rounded-full text-[10px] tracking-wide uppercase px-2 py-[2px]"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(59,130,246,0.18))",
                        border: "1px solid rgba(59,130,246,0.7)",
                        color: "rgba(191,219,254,0.96)",
                        boxShadow: "0 0 12px rgba(37,99,235,0.6)",
                      }}
                    >
                      Soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

