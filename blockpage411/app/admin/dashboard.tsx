// app/admin/dashboard.tsx 
"use client";

import useSWR from "swr";
import { usePathname } from "next/navigation";
import AdminLayout from "../components/admin/AdminLayout";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

export default function AdminDashboard() {
  const { data, error } = useSWR("/api/admin/summary", fetcher);
  const pathname = usePathname() || "/admin/dashboard";

  if (error)
    return (
      <AdminLayout currentPath={pathname} adminWallet="">
        <div className="text-sm text-red-400">Error loading dashboard.</div>
      </AdminLayout>
    );

  if (!data)
    return (
      <AdminLayout currentPath={pathname} adminWallet="">
        <div className="text-sm text-slate-300">Loading dashboard…</div>
      </AdminLayout>
    );

  return (
    <AdminLayout currentPath={pathname} adminWallet="">
      <section className="mb-6 max-w-6xl">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-100 mb-1">
          Signals Overview
        </h2>
        <p className="text-sm text-slate-300/90">
          High-level view of suspicious activity, popular wallets, and recent
          user-generated signals. Use this to spot spikes that may require
          deeper investigation.
        </p>
      </section>

      <section className="grid gap-6 max-w-6xl md:grid-cols-2">
        <div className="rounded-3xl border border-red-500/40 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-red-100">
              Suspicious Wallets
            </h3>
            <span className="text-[11px] text-red-200/80">
              {data.suspicious.length} tracked
            </span>
          </div>
          <ul className="space-y-2 max-h-64 overflow-auto pr-1">
            {data.suspicious.map(
              (wallet: {
                address: string;
                chain: string;
                flags?: string[];
                blacklisted?: boolean;
              }) => (
                <li
                  key={wallet.address + wallet.chain}
                  className="bg-red-900/30 border border-red-700/60 rounded-2xl px-3 py-2 flex flex-col gap-1"
                >
                  <span className="text-[11px] font-mono text-red-50 break-all">
                    {wallet.address} ({wallet.chain})
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-red-200/90">
                    <span>Flags: {wallet.flags?.length || 0}</span>
                    <span>
                      Blacklisted: {wallet.blacklisted ? "Yes" : "No"}
                    </span>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="rounded-3xl border border-emerald-500/40 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-emerald-100">
              Popular Wallets
            </h3>
            <span className="text-[11px] text-emerald-200/80">
              {data.popular.length} tracked
            </span>
          </div>
          <ul className="space-y-2 max-h-64 overflow-auto pr-1">
            {data.popular.map(
              (wallet: {
                address: string;
                chain: string;
                flags?: string[];
                blacklisted?: boolean;
              }) => (
                <li
                  key={wallet.address + wallet.chain}
                  className="bg-emerald-900/25 border border-emerald-700/60 rounded-2xl px-3 py-2 flex flex-col gap-1"
                >
                  <span className="text-[11px] font-mono text-emerald-50 break-all">
                    {wallet.address} ({wallet.chain})
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-emerald-200/90">
                    <span>Flags: {wallet.flags?.length || 0}</span>
                    <span>
                      Blacklisted: {wallet.blacklisted ? "Yes" : "No"}
                    </span>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      <section className="mt-6 max-w-6xl">
        <div className="rounded-3xl border border-amber-400/40 bg-black/70 shadow-[0_18px_45px_rgba(0,0,0,0.9)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-100">
              Flag &amp; Rating Review
            </h3>
            <span className="text-[11px] text-amber-200/80">
              {data.flags.length} flags · {data.ratings.length} ratings
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-semibold text-red-100 mb-2">
                Recent Flags
              </h4>
              <ul className="space-y-2 max-h-52 overflow-auto pr-1">
                {data.flags.map(
                  (flag: {
                    _id: string;
                    address: string;
                    chain: string;
                    reason?: string;
                    comment?: string;
                  }) => (
                    <li
                      key={flag._id}
                      className="bg-red-900/25 border border-red-700/60 rounded-2xl px-3 py-2"
                    >
                      <span className="text-[11px] text-red-50 font-mono break-all">
                        Wallet: {flag.address} ({flag.chain})
                      </span>
                      <br />
                      <span className="text-[11px] text-red-200">
                        Reason: {flag.reason}
                      </span>
                      <br />
                      {flag.comment && (
                        <span className="text-[11px] text-slate-200">
                          Comment: {flag.comment}
                        </span>
                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-emerald-100 mb-2">
                Recent Ratings
              </h4>
              <ul className="space-y-2 max-h-52 overflow-auto pr-1">
                {data.ratings.map(
                  (rating: {
                    _id: string;
                    address: string;
                    chain: string;
                    score: number;
                    text?: string;
                  }) => (
                    <li
                      key={rating._id}
                      className="bg-emerald-900/25 border border-emerald-700/60 rounded-2xl px-3 py-2"
                    >
                      <span className="text-[11px] text-emerald-50 font-mono break-all">
                        Wallet: {rating.address} ({rating.chain})
                      </span>
                      <br />
                      <span className="text-[11px] text-emerald-200">
                        Score: {rating.score}
                      </span>
                      <br />
                      {rating.text && (
                        <span className="text-[11px] text-slate-200">
                          Comment: {rating.text}
                        </span>
                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
