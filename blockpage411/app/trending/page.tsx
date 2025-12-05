"use client";
import React, { useEffect, useState } from "react";
import { TrendingSection, TrendingWalletCard, TrendingCharityCard, TrendingEventCard } from "../../components/trending/TrendingSection";
import type { TrendingResponse } from "../../pages/api/trending";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TrendingPage() {
  const [data, setData] = useState<TrendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/trending");
        if (!res.ok) {
          throw new Error(`Request failed with ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load trending data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const wallets = data?.wallets ?? [];
  const mostSearched = data?.mostSearchedWallets ?? [];
  const mostFlagged = data?.mostFlaggedWallets ?? [];
  const charities = data?.charities ?? [];
  const events = data?.events ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-slate-950 to-black">
      <Navbar />
      <main id="content" className="flex-1 w-full px-4 pt-16 pb-20">
        <section className="max-w-6xl mx-auto mb-10 text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-amber-300 to-emerald-400">
            Trending on Blockpage411
          </h1>
          <p className="text-sm md:text-base text-slate-300/90 max-w-2xl">
            Live view of wallets, charities, and fundraisers that are getting
            the most attention across the network right now.
          </p>
        </section>

        {error && (
          <div className="max-w-6xl mx-auto mb-6 rounded-2xl border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <TrendingSection
          title="Trending Wallets"
          subtitle="Highly flagged or active wallets that the community is watching."
          loading={loading}
          items={wallets.map((w) => (
            <TrendingWalletCard key={w.address + w.chain} {...w} />
          ))}
        />

        <TrendingSection
          title="Most Searched Wallets"
          subtitle="Addresses with the highest search counts across Blockpage411."
          loading={loading}
          items={mostSearched.map((w) => (
            <TrendingWalletCard key={"search-" + w.address + w.chain} {...w} />
          ))}
        />

        <TrendingSection
          title="Most Flagged Wallets"
          subtitle="Wallets drawing the most moderation attention from the community."
          loading={loading}
          items={mostFlagged.map((w) => (
            <TrendingWalletCard key={"flag-" + w.address + w.chain} {...w} />
          ))}
        />

        <TrendingSection
          title="Rising Charities"
          subtitle="Charities and organizations recently added or actively receiving support."
          loading={loading}
          items={charities.map((c) => (
            <TrendingCharityCard key={c.id} {...c} />
          ))}
        />

        <TrendingSection
          title="Active Fundraisers"
          subtitle="Fundraising campaigns approaching deadlines or gaining traction."
          loading={loading}
          items={events.map((e) => (
            <TrendingEventCard key={e.id} {...e} />
          ))}
        />
      </main>
      <Footer />
    </div>
  );
}
