"use client";
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import UserProfile from '../../../components/UserProfile';
import RiskMeter from "../../../components/RiskMeter";
import RiskBadge from "../../../../components/RiskBadge";
import StatusBadges from "./StatusBadges";
import ShowTransactionsButton from "./ShowTransactionsButton";
import DonationSectionSkeleton from './DonationSectionSkeleton';
const DonationSection = dynamic(() => import('./DonationSection'), { ssr: false, loading: () => <DonationSectionSkeleton /> });
import V5UpgradeInfo from "./V5UpgradeInfo";
import WalletFlagSection from "./WalletFlagSection";
import WalletRiskPanel from '../../../components/WalletRisk/WalletRiskPanel';
import WalletRatingSection from "./WalletRatingSection";
import Footer from "../../../components/Footer";
import { useRouter } from "next/navigation";
import type { Flag, DonationRequest } from "../../../../lib/types";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WalletProfileClient({ initialData, chain, address }: { initialData: any; chain: string; address: string }) {
  const { data, error, mutate } = useSWR(`/api/wallet/${chain}/${address}`, fetcher, { fallbackData: initialData });
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
      const currentAddress = (address || '').toLowerCase();
      const isAdminWallet = envAdmins.includes(currentAddress);
      setIsAdmin(isAdminWallet);
    }
  }, [address]);

  if (error) return <div className="text-center py-10 text-red-400">Failed to load wallet data.</div>;
  if (!data) return <div className="text-center py-10 text-cyan-200">Loading...</div>;

  const hasActiveDonation = data?.donationRequests?.some((d: DonationRequest) => d.active);
  const avatarUrl: string | undefined = data?.nftAvatarUrl || data?.avatarUrl;
  // Support both legacy and new API shapes (`riskScore` vs `risk_score`).
  const riskScore: number | null = typeof data?.risk_score === 'number' ? data.risk_score : (typeof data?.riskScore === 'number' ? data.riskScore : null);
  const riskCategory = (data?.risk_level || data?.riskCategory || null) as 'low' | 'medium' | 'high' | null;

  const visibilityLabel = (() => {
    const vis = data?.visibility as
      | { canSeeBalance?: boolean; isOwner?: boolean; heavilyFlagged?: boolean; isPublic?: boolean; unlockLevel?: number }
      | undefined;
    if (!vis) return null;
    if (vis.isOwner) return 'Owner view (you are viewing your own wallet)';
    if (vis.canSeeBalance) return 'Public view (balances visible to anyone)';
    return 'Limited view (balances hidden for most viewers)';
  })();

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="flex-1 w-full max-w-3xl px-4 py-8 mt-16" style={{ width: '100%', maxWidth: '920px' }}>
        <div className="rounded-xl shadow-md p-6" style={{ background: 'linear-gradient(180deg, #061026 0%, #071630 100%)', border: '1px solid rgba(99,102,241,0.06)', boxShadow: '0 6px 18px rgba(2,6,23,0.6)' }}>
          <V5UpgradeInfo />
          <div className="mb-4">
            <UserProfile walletAddress={address} chain={chain} />
            <div className="text-sm text-slate-400 mt-2">Chain: {chain}</div>
          </div>
          <div className="my-6">
            <WalletRiskPanel risk_score={data?.risk_score ?? data?.riskScore} risk_level={data?.risk_level ?? data?.riskCategory} flags={data?.flags || []} behavior_signals={data?.behavior_signals || {}} />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <RiskMeter score={riskScore ?? undefined} category={riskCategory ?? undefined} />
            <div className="mt-2">
              <RiskBadge score={riskScore} category={riskCategory || undefined} />
            </div>
          </div>
          {visibilityLabel && (
            <div className="mt-2 text-[11px] text-slate-300">
              View mode:{' '}
              <span className="font-semibold text-cyan-200">{visibilityLabel}</span>
            </div>
          )}
          <StatusBadges suspicious={data?.suspicious} popular={data?.popular} blacklisted={data?.blacklisted} flagsCount={data?.flags?.length} kycStatus={data?.kycStatus} verificationBadge={data?.verificationBadge} />
          <div className="my-6 border-t border-blue-800"></div>

          <section className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
            <div className="flex-1 min-w-0">
              <WalletFlagSection flags={data?.flags} address={address} chain={chain} onFlag={async (reason, comment) => {
                const res = await fetch("/api/flags", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ address, chain, reason, comment }),
                  credentials: 'include'
                });
                if (!res.ok) {
                  let body: unknown = null;
                  try { body = await res.json(); } catch {}
                  const obj = body as Record<string, unknown> | null;
                  const err = new Error(obj && typeof obj.message === 'string' ? obj.message : 'Flagging failed');
                  (err as unknown as Record<string, unknown>).status = res.status;
                  throw err;
                }
                await mutate();
                return res;
              }} />
            </div>
            <div className="flex-1 min-w-0 mt-8 lg:mt-0">
              <WalletRatingSection
                address={address}
                chain={chain}
                ratings={data?.ratings || []}
                userRating={Number(data?.userRating || 0)}
                verificationScore={data?.verificationScore}
                onRate={async (score, text) => {
                  await fetch("/api/ratings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address, chain, rating: score, text })
                  });
                  mutate();
                }}
              />
            </div>
          </section>
          {isAdmin && (
            <div className="mb-6 bg-blue-950/60 border border-blue-700 rounded-lg p-4 mt-6">
              <h2 className="text-lg font-bold text-yellow-300 mb-2">Admin</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-red-700 text-white text-sm">Blacklist</button>
                <button className="px-3 py-1 rounded bg-indigo-700 text-white text-sm">Deactivate</button>
              </div>
            </div>
          )}

          <div className="my-6 border-t border-blue-800"></div>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="font-bold text-cyan-300">KYC Status:</span>
            {data?.kycStatus === 'verified' && <span className="badge bg-green-600">Verified</span>}
            {data?.kycStatus === 'pending' && <span className="badge bg-yellow-500">Pending</span>}
            {data?.kycStatus === 'rejected' && <span className="badge bg-red-600">Rejected</span>}
            {!data?.kycStatus && <span className="text-gray-400">Not Requested</span>}
            {data?.kycStatus !== 'verified' && (
              <KYCRequestButton />
            )}
          </div>
          <DonationSection donationRequests={data?.donationRequests} />
          {!hasActiveDonation && (
            <div className="mt-6">
              <button className="btn-primary bg-gradient-to-r from-green-500 to-teal-500 hover:from-teal-500 hover:to-green-500 transition-all duration-200 transform hover:scale-105 py-2 px-6 font-bold"
                onClick={() => router.push(`/donate?address=${address}&chain=${chain}`)}>
                Request Donation
              </button>
            </div>
          )}

          <div className="my-6 border-t border-blue-800"></div>
          {data?.showBalance === false ? (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-200">Assets hidden</h3>
                  <div className="text-yellow-200 text-sm">
                    Flags:
                    <span className="font-mono">{data?.flagsCount || 0}</span>
                    {" "}/
                    <span className="font-mono">{data?.flagThreshold || data?.flagsRequired || 3}</span>
                  </div>
                  <p className="text-yellow-200 text-xs mt-1">
                    For privacy, transaction history and balances stay hidden until this wallet reaches the required community flags.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-yellow-700 text-white text-sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  >
                    Flag
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-transparent border border-yellow-700 text-yellow-200 text-sm"
                    onClick={() => mutate()}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ShowTransactionsButton chain={chain} address={address} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function KYCRequestButton() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  return (
    <span className="inline-block">
      <button
        className="ml-4 px-3 py-1 rounded bg-cyan-700 text-white font-bold disabled:opacity-60"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch('/api/kyc-request', { method: 'POST', credentials: 'include' });
            const result = await res.json();
            if (result.kycUrl) {
              window.open(result.kycUrl, '_blank');
            } else {
              setError(result.message || 'KYC request failed');
            }
          } catch {
            setError('Network error');
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? 'Requesting...' : 'Request KYC'}
      </button>
      {error && <span className="ml-2 text-red-400 text-xs">{error}</span>}
    </span>
  );
}
