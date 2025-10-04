export default function Features() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4 animate-fade-in delay-300">
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-blue-400 text-2xl font-bold mb-2 block">
          Multi-Chain
        </span>
        <p className="text-cyan-200 text-sm">
          Supports Ethereum, Polygon, BNB, Solana, Avalanche, Bitcoin, Cardano,
          Tron, XRP and more.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-yellow-400 text-2xl font-bold mb-2 block">
          Star Ratings
        </span>
        <p className="text-cyan-200 text-sm">
          Rate and review wallets for trust and transparency.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-pink-400 text-2xl font-bold mb-2 block">
          Social Profiles
        </span>
        <p className="text-cyan-200 text-sm">
          Connect your social accounts for a richer blockchain identity.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-green-400 text-2xl font-bold mb-2 block">
          KYC & Verification
        </span>
        <p className="text-cyan-200 text-sm">
          Advanced KYC and verification for secure interactions.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-indigo-400 text-2xl font-bold mb-2 block">
          Donation Requests
        </span>
        <p className="text-cyan-200 text-sm">
          Request and manage donations directly from your wallet profile.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-red-400 text-2xl font-bold mb-2 block">
          Moderation
        </span>
        <p className="text-cyan-200 text-sm">
          Community-driven moderation for safer blockchain interactions.
        </p>
      </div>
      <div className="bg-gradient-to-br from-[#181f2f] to-[#232b45] rounded-xl shadow-lg p-6 border border-blue-800 backdrop-blur-lg">
        <span className="text-purple-400 text-2xl font-bold mb-2 block">
          Avatar Upload
        </span>
        <p className="text-cyan-200 text-sm">
          Personalize your wallet profile with custom avatars.
        </p>
      </div>
    </div>
  );
}
