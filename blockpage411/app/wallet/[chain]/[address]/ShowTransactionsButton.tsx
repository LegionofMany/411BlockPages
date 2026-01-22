import React from "react";
import { useRouter } from "next/navigation";

export default function ShowTransactionsButton({ chain, address }: { chain: string; address: string }) {
  const router = useRouter();
  return (
    <button
      className="btn-primary bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 transform hover:scale-105 py-2 px-6 font-bold mb-4 w-full sm:w-auto"
      onClick={() => router.push(`/wallet/${chain}/${address}/transactions`)}
    >
      Show Recent Transactions
    </button>
  );
}
