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
  return (
    <div className="w-full mb-12 animate-fade-in delay-150 py-2">
      <h2 className="text-2xl font-bold text-center mb-6 text-cyan-200">Supported Chains</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4 md:gap-6">
        {chains.map((chain) => (
          <div
            key={chain.name}
            className="flex flex-col items-center bg-gray-800/50 p-3 rounded-lg shadow-lg hover:bg-gray-700/50 transition-colors duration-200"
          >
            <Image
              src={chain.src}
              alt={chain.name}
              width={48}
              height={48}
              className="mb-2 rounded-full"
            />
            <span className="text-xs text-cyan-200 font-semibold tracking-wide text-center">
              {chain.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
