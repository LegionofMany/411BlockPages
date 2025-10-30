"use client";
import React, { useState, useEffect } from "react";
import ProfileInfo from "./ProfileInfo";
import RiskMeter from "../../../components/RiskMeter";
import StatusBadges from "./StatusBadges";
// TransactionList is currently unused; keep import commented until used
// import TransactionList from "./TransactionList";
import ShowTransactionsButton from "./ShowTransactionsButton";
import DonationSection from "./DonationSection";
import V5UpgradeInfo from "./V5UpgradeInfo";
import WalletFlagSection from "./WalletFlagSection";
import WalletRatingSection from "./WalletRatingSection";
import Footer from "../../../components/Footer";
import { useRouter } from "next/navigation";
import type { Flag, DonationRequest } from "../../../../lib/types";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function WalletProfile({ params }: { params: Promise<{ chain: string; address: string }> }) {
  const { chain, address } = React.use(params);
  const { data, error, mutate } = useSWR(`/api/wallet/${chain}/${address}`, fetcher);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
      const currentAddress = address.toLowerCase();
      const isAdminWallet = envAdmins.includes(currentAddress);
      setIsAdmin(isAdminWallet);
    }
  }, [address]);

  if (error) return <div className="text-center py-10 text-red-400">Failed to load wallet data.</div>;
  if (!data) return <div className="text-center py-10 text-cyan-200">Loading...</div>;

  const hasActiveDonation = data?.donationRequests?.some((d: DonationRequest) => d.active);

    return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="flex-1 w-full max-w-4xl px-4 py-8 mt-16">
        <div className="bg-gray-900/80 rounded-2xl shadow-2xl p-8 border-2 border-blue-700">
          <V5UpgradeInfo />
          <ProfileInfo displayName={data?.displayName} avatarUrl={data?.avatarUrl} address={address} chain={chain} />
          <RiskMeter score={data?.riskScore} category={data?.riskCategory} />
          <StatusBadges suspicious={data?.suspicious} popular={data?.popular} blacklisted={data?.blacklisted} flagsCount={data?.flags?.length} kycStatus={data?.kycStatus} verificationBadge={data?.verificationBadge} />
          <div className="my-6 border-t border-blue-800"></div>
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
              // attach status for callers to inspect
              (err as unknown as Record<string, unknown>).status = res.status;
              throw err;
            }
            await mutate();
            return res;
          }} />
          {isAdmin && (
            <CommunityTab data={data} address={address} mutate={mutate} />
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
          <div className="my-6 border-t border-blue-800"></div>
          <ShowTransactionsButton chain={chain} address={address} />
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

type CommunityTabProps = {
  data: {
    flags?: Array<Flag & { _id: string; flaggedBy?: string }>;
    donationRequests?: Array<{ _id: string; active: boolean }>;
  };
  address: string;
  mutate: () => void;
};
type ModalData = {
  wallet?: string;
  flagId?: string;
  donationId?: string;
  reason?: string;
  date?: string | number | Date;
  flaggedBy?: string;
};
function CommunityTab({ data, address, mutate }: CommunityTabProps) {
  const [showModal, setShowModal] = React.useState<string|null>(null);
  const [modalData, setModalData] = React.useState<ModalData|null>(null);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };
  return (
    <div className="mb-6 bg-blue-950/60 border border-blue-700 rounded-xl p-4">
      <h2 className="text-lg font-bold text-yellow-300 mb-2">Community Moderation (Admin)</h2>
      <div className="flex flex-col gap-2">
        <button className="px-4 py-2 rounded bg-red-700 text-white font-bold" onClick={()=>{setShowModal('blacklist');setModalData({wallet: address});}}>Blacklist Wallet</button>
        {data?.flags && data.flags.length > 0 && (
          <div className="mt-4">
            <h3 className="text-base font-semibold text-yellow-200 mb-2">Flags</h3>
            <ul className="space-y-2">
              {data.flags.map((flag: Flag) => (
                <li key={flag._id} className="bg-yellow-900/40 border border-yellow-700 rounded p-3 flex flex-col gap-1">
                  <span className="text-yellow-100 text-sm">Flag ID: <span className="font-mono">{flag._id}</span></span>
                  {flag.reason && <span className="text-yellow-200 text-xs">Reason: {flag.reason}</span>}
                  {flag.date && <span className="text-yellow-200 text-xs">Date: {new Date(flag.date).toLocaleString()}</span>}
                  {flag.flaggedBy && <span className="text-yellow-200 text-xs">Flagged By: {flag.flaggedBy}</span>}
                  <button
                    className="mt-2 px-3 py-1 rounded bg-yellow-700 text-white font-bold text-xs self-start"
                    onClick={() => {
                      setShowModal('dismissFlag');
                      setModalData({ wallet: address, flagId: flag._id, reason: flag.reason, date: flag.date, flaggedBy: flag.flaggedBy });
                    }}
                  >
                    Dismiss Flag
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data?.donationRequests && data.donationRequests.some((d: { active: boolean })=>d.active) && (
          <button
            className="px-4 py-2 rounded bg-indigo-700 text-white font-bold"
            onClick={() => {
              const activeDonation = data?.donationRequests?.find((d: { active: boolean }) => d.active);
              if (activeDonation?._id) {
                setShowModal('deactivateDonation');
                setModalData({ donationId: activeDonation._id });
              }
            }}
          >
            Deactivate Donation
          </button>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 border border-blue-700 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-yellow-200">Confirm Admin Action</h3>
            {showModal === 'dismissFlag' && modalData && (
              <div className="mb-4 text-blue-200 text-sm">
                <div><b>Flag ID:</b> <span className="font-mono">{modalData.flagId}</span></div>
                {modalData.reason && <div><b>Reason:</b> {modalData.reason}</div>}
                {modalData.date && <div><b>Date:</b> {new Date(modalData.date).toLocaleString()}</div>}
                {modalData.flaggedBy && <div><b>Flagged By:</b> {modalData.flaggedBy}</div>}
              </div>
            )}
            <p className="mb-4 text-blue-200">Are you sure you want to {showModal === 'blacklist' ? 'blacklist this wallet' : showModal === 'dismissFlag' ? 'dismiss this flag' : 'deactivate this donation'}?</p>
            <div className="flex gap-4">
              <button className="px-4 py-2 rounded bg-green-700 text-white font-bold" onClick={async()=>{
                if (!modalData) return;
                try {
                  if(showModal==='blacklist'){
                    await fetch('/api/admin/blacklist', {method:'POST',headers:{'Content-Type':'application/json','x-admin-address':address},body:JSON.stringify({wallet:modalData.wallet,reason:'Admin action'})});
                  }
                  if(showModal==='dismissFlag'){
                    await fetch('/api/admin/dismissFlag', {method:'POST',headers:{'Content-Type':'application/json','x-admin-address':address},body:JSON.stringify({wallet:modalData.wallet,flagId:modalData.flagId})});
                  }
                  if(showModal==='deactivateDonation'){
                    await fetch('/api/admin/deactivateDonation', {method:'POST',headers:{'Content-Type':'application/json','x-admin-address':address},body:JSON.stringify({donationId:modalData.donationId})});
                  }
                  showToast('success', 'Action completed successfully');
                  setShowModal(null); mutate();
                } catch {
                  showToast('error', 'Action failed');
                  setShowModal(null);
                }
             }}>Confirm</button>
              <button className="px-4 py-2 rounded bg-gray-700 text-white font-bold" onClick={()=>setShowModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-xl z-50 text-white font-bold ${toast.type === 'success' ? 'bg-green-700' : 'bg-red-700'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default WalletProfile;