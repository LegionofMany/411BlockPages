import Image from "next/image";

export default function SampleWallet() {
  return (
    <div className="mt-10 flex justify-center animate-fade-in delay-400">
      <div className="glass p-6 rounded-xl shadow-xl flex flex-col items-center w-96">
        <Image
          src="/logos/ethereum.png"
          alt="Sample Avatar"
          width={80}
          height={80}
          className="rounded-full mb-4 border-4 border-blue-500"
        />
        <h3 className="text-2xl font-bold text-white mb-2">Vitalik Buterin</h3>
        <div className="flex gap-2 mb-2">
          <span className="badge bg-green-600">KYC Verified</span>
          <span className="badge bg-yellow-500">4.9 ★ (1,234 reviews)</span>
        </div>
        <div className="flex gap-2 mb-2">
          <span className="badge bg-blue-500">@VitalikButerin</span>
          <span className="badge bg-indigo-500">vitalik.eth</span>
        </div>
        <span className="text-cyan-100 text-sm mb-2">
          Accepting Donations for Public Goods
        </span>
        <span className="text-xs text-gray-300">0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045</span>
      </div>
    </div>
  );
}
