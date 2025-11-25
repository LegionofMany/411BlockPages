"use client";
import React from "react";
import RealTimeTransactions from "../components/landing/RealTimeTransactions";

export default function RealTimeTransactionsPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        backgroundColor: "#020617",
        backgroundImage:
          "radial-gradient(circle_at_top,_rgba(15,23,42,0.9),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),transparent_55%)",
      }}
    >
      <main className="flex-1 w-full flex flex-col items-center pt-24 pb-16 px-4">
        <div className="w-full max-w-6xl">
          <header className="mb-10 text-left">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-400/80 mb-3">
              Live feed
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-50 mb-2">
              Real-time blockchain transactions
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl">
              Monitor fresh on-chain activity across supported networks, with per-network controls and explorer
              deep links in a single professional console.
            </p>
          </header>
          <RealTimeTransactions />
        </div>
      </main>
    </div>
  );
}
