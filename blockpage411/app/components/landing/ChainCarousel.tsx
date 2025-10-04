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
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4 md:gap-6 hidden sm:grid">
        {chains.map((chain) => (
          <div
            key={chain.name}
            className="flex flex-col items-center bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg px-2 py-2 md:px-4 md:py-3 backdrop-blur-lg border border-blue-800 hover:scale-105 transition-all duration-200"
          >
            <Image
              src={chain.src}
              alt={chain.name}
              width={44}
              height={44}
              className="mb-1 rounded-lg shadow-lg w-[36px] h-[36px] md:w-[44px] md:h-[44px] object-contain"
            />
            <span className="text-xs text-cyan-200 mt-1 font-semibold tracking-wide text-center break-words">
              {chain.name}
            </span>
          </div>
        ))}
      </div>
      <div className="flex sm:hidden overflow-x-auto gap-4 py-2 scrollbar-hide">
        {chains.map((chain) => (
          <div
            key={chain.name}
            className="flex flex-col items-center bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg px-2 py-2 min-w-[70px] backdrop-blur-lg border border-blue-800 hover:scale-105 transition-all duration-200"
          >
            <Image
              src={chain.src}
              alt={chain.name}
              width={32}
              height={32}
              className="mb-1 rounded-lg shadow-lg w-[32px] h-[32px] object-contain"
            />
            <span className="text-xs text-cyan-200 mt-1 font-semibold tracking-wide text-center break-words">
              {chain.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
