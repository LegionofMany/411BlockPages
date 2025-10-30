import Image from "next/image";
import { FiCheckCircle, FiStar } from "react-icons/fi";

export default function SampleWallet() {
  return (
    <section className="w-full max-w-6xl mx-auto text-center py-16 px-4">
      <h2
        className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(255,221,128,0.98), rgba(255,179,77,0.95), rgba(196,145,45,0.9))',
          WebkitBackgroundClip: 'text',
          textShadow: '0 6px 18px rgba(124,58,237,0.06)'
        }}
      >
        A Glimpse of a Trusted Profile
      </h2>
      <p className="mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,215,102,0.88)' }}>
        See how reputation, verification, and community feedback come together to form a complete on-chain identity.
      </p>
      <div className="mt-10 flex justify-center">
        <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl bg-[rgba(10,14,24,0.46)] backdrop-blur-lg border flex flex-col items-center transform hover:scale-105 transition-transform duration-300"
          style={{ borderColor: 'rgba(99,179,237,0.22)' }}
        >
          <Image
            src="/logos/ethereum.png"
            alt="Sample Avatar"
            width={80}
            height={80}
            className="rounded-full mb-4 border-4 border-blue-500/50"
          />
          <h3 className="text-2xl font-bold mb-2" style={{ backgroundImage: 'linear-gradient(90deg,#ffd67a,#ffb84d)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Vitalik.eth</h3>
          <p className="text-sm font-mono mb-4" style={{ color: 'rgba(255,215,120,0.82)' }}>0xd8dA6BF2...7aA96045</p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
              <FiCheckCircle />
              <span className="text-sm font-medium">KYC Verified</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              <FiStar />
              <span className="text-sm font-medium">4.9 (1.2k reviews)</span>
            </div>
          </div>

          <div className="w-full bg-slate-900/50 p-4 rounded-lg text-center">
            <p className="text-slate-300 text-sm">
              Accepting Donations for Public Goods
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
