import Image from "next/image";

export default function SampleWallet() {
  return (
    <div className="mt-10 flex justify-center animate-fade-in delay-400">
      <div className="card bg-gray-900/80 p-6 rounded-xl shadow-xl flex flex-col items-center w-80">
        <Image
          src="/avatars/sample-avatar.png"
          alt="Sample Avatar"
          width={72}
          height={72}
          className="rounded-full mb-3 border-4 border-blue-500"
        />
        <div className="flex gap-2 mb-2">
          <span className="badge bg-green-600">KYC Verified</span>
          <span className="badge bg-yellow-500">4.9 ★</span>
        </div>
        <div className="flex gap-2 mb-2">
          <span className="badge bg-blue-500">Twitter</span>
          <span className="badge bg-indigo-500">Discord</span>
          <span className="badge bg-pink-500">Instagram</span>
        </div>
        <span className="text-cyan-100 text-sm mb-2">
          Donation Request:{" "}
          <span className="font-bold text-green-400">0.05 ETH</span>
        </span>
        <span className="text-xs text-gray-300">0xDemoWallet</span>
      </div>
    </div>
  );
}
