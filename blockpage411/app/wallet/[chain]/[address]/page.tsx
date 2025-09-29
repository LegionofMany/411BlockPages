"use client";
import useSWR from "swr";
import Navbar from "../../../components/Navbar";
import ProfileInfo from "./ProfileInfo";
import StatusBadges from "./StatusBadges";
import TransactionList from "./TransactionList";
import DonationSection from "./DonationSection";
import V5UpgradeInfo from "./V5UpgradeInfo";
import WalletFlagSection from "./WalletFlagSection";
import WalletRatingSection from "./WalletRatingSection";
import { useState } from "react";
import Footer from "../../../components/Footer";
import { useRouter, useParams } from "next/navigation";
import type { DonationRequest, Flag } from "../../../../lib/types";
import React from "react";

function WalletProfile() {
  const router = useRouter();
  const params = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const chain = typeof params?.chain === 'string' ? params.chain : Array.isArray(params?.chain) ? params.chain[0] : '';
  const address = typeof params?.address === 'string' ? params.address : Array.isArray(params?.address) ? params.address[0] : '';
  const { data, mutate } = useSWR(chain && address ? `/api/wallet/${chain}/${address}` : null, url => fetch(url).then(res => res.json()));
  const hasActiveDonation = data?.donationRequests?.some((d: DonationRequest) => d.active);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
      const currentAddress = address.toLowerCase();
      const isAdminWallet = envAdmins.includes(currentAddress);
      setIsAdmin(isAdminWallet);
    }
  }, [address]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col items-center">
      <Navbar variant="wallet" />
      <div className="max-w-xl w-full bg-gray-900/80 rounded-2xl shadow-xl mt-10 p-8 flex flex-col items-center border border-blue-700">
        <V5UpgradeInfo />
        <ProfileInfo displayName={data?.displayName} avatarUrl={data?.avatarUrl} address={address} chain={chain} />
        <StatusBadges suspicious={data?.suspicious} popular={data?.popular} blacklisted={data?.blacklisted} flagsCount={data?.flags?.length} kycStatus={data?.kycStatus} verificationBadge={data?.verificationBadge} />
  <WalletFlagSection flags={data?.flags} onFlag={async (reason, comment) => {
          await fetch("/api/flags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, chain, reason, comment })
          });
          mutate();
        }} />
        {isAdmin && (
          <CommunityTab data={data} address={address} mutate={mutate} />
        )}
        {data?.kycStatus && (
          <div className="mt-4 w-full text-left">
            <span className="font-bold text-cyan-300">KYC Status:</span> <span className="text-cyan-200">{data.kycStatus}</span>
          </div>
        )}
        <DonationSection donationRequests={data?.donationRequests} />
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
        {!hasActiveDonation && (
          <div className="mt-4 w-full text-left">
            <button className="px-4 py-2 rounded bg-green-700 text-white font-bold" onClick={() => router.push(`/donate?address=${address}&chain=${chain}`)}>
              Request Donation
            </button>
          </div>
        )}
        <TransactionList transactions={data?.transactions} />
      </div>
      <Footer />
    </div>
  );
}

// CommunityTab component for admin moderation
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
  // Toast notification state
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Helper to show toast
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
      {/* Confirmation Modal */}
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
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-xl z-50 text-white font-bold ${toast.type === 'success' ? 'bg-green-700' : 'bg-red-700'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default WalletProfile;
