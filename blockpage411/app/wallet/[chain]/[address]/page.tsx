"use client";
import Navbar from "../../../components/Navbar";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import Footer from "../../../components/Footer";
import Image from "next/image";
import type { DonationRequest } from "../../../../lib/types";
import React from "react";

// CommunityTab component for admin moderation
type CommunityTabProps = {
  data: {
    flags?: Array<{ _id: string }>;
    donationRequests?: Array<{ _id: string; active: boolean }>;
  };
  address: string;
  mutate: () => void;
};
type ModalData = {
  wallet?: string;
  flagId?: string;
  donationId?: string;
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
              {data.flags.map((flag: any) => (
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
                } catch (err) {
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

export default function WalletProfile() {
  // ...existing code...
  // Place debug JSX after all variable declarations
  const router = useRouter();
  const params = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminWallets, setAdminWallets] = useState<string[]>([]);
  // Removed duplicate declaration of params
  // Removed duplicate declaration of router
  const chain = typeof params?.chain === 'string' ? params.chain : Array.isArray(params?.chain) ? params.chain[0] : '';
  const address = typeof params?.address === 'string' ? params.address : Array.isArray(params?.address) ? params.address[0] : '';
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
      setAdminWallets(envAdmins);
      const currentAddress = address.toLowerCase();
      const isAdminWallet = envAdmins.includes(currentAddress);
      setIsAdmin(isAdminWallet);
      // Debug logs
      console.log('Admin Wallets:', envAdmins);
      console.log('Current Wallet:', currentAddress);
      console.log('Is Admin:', isAdminWallet);
    }
  }, [address]);
  // Flagging state
  const [flagReason, setFlagReason] = useState("");
  const [flagSendAddress, setFlagSendAddress] = useState("");
  const [flagReceiveAccount, setFlagReceiveAccount] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flagError, setFlagError] = useState<string|null>(null);
  
  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File|null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string|null>(null);
  // Use only one set of params, chain, and address declarations
  const { data, mutate } = useSWR(chain && address ? `/api/wallet/${chain}/${address}` : null, url => fetch(url).then(res => res.json()));
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({ displayName: '', avatarUrl: '', bio: '', telegram: '', twitter: '', discord: '', website: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string|null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editValidation, setEditValidation] = useState<{[key:string]:string}>({});

  // Donation button state
  const hasActiveDonation = data?.donationRequests?.some((d: DonationRequest) => d.active);

  // Pre-fill edit form when entering edit mode
  const startEdit = () => {
    if (data) {
      setEditProfile({
        displayName: data.displayName || '',
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
        telegram: data.telegram || '',
        twitter: data.twitter || '',
        discord: data.discord || '',
        website: data.website || ''
      });
      setEditing(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col items-center">
      {/* Navbar is fixed, so add margin-top to push debug info below it */}
      <div style={{ marginTop: '80px' }} className="bg-gray-800 text-yellow-300 p-3 rounded mb-4 text-xs w-full max-w-xl">
        <div><strong>Debug Info:</strong></div>
        <div>Current Wallet: <span className="font-mono">{address}</span></div>
        <div>Admin Wallets: <span className="font-mono">{adminWallets.join(", ")}</span></div>
        <div>Is Admin: <span className="font-bold">{isAdmin ? "YES" : "NO"}</span></div>
      </div>
  <Navbar variant="wallet" />
      <div className="max-w-xl w-full bg-gray-900/80 rounded-2xl shadow-xl mt-10 p-8 flex flex-col items-center border border-blue-700">
        <div className="flex flex-col items-center mb-6">
          {data?.avatarUrl ? (
            <Image src={data.avatarUrl} alt="avatar" width={80} height={80} className="rounded-full border-2 border-cyan-400 mb-2 bg-cyan-900" />
          ) : (
            <div className="rounded-full border-2 border-cyan-400 mb-2 bg-cyan-900 w-20 h-20 flex items-center justify-center">
              <span className="text-cyan-300 text-3xl">&#9787;</span>
            </div>
          )}
          <span className="text-2xl font-bold text-cyan-100">{data?.displayName || "Wallet Profile"}</span>
          <span className="font-mono text-lg text-cyan-200 break-all mt-2">{address}</span>
          <span className="text-cyan-400 mt-1">Chain: {chain}</span>
          {/* Status tags on profile page */}
          <div className="flex gap-2 mt-2">
            {data?.blacklisted && <span className="px-2 py-1 rounded bg-red-700 text-red-100 text-xs font-bold">Blacklisted</span>}
            {data?.flags && data.flags.length > 0 && <span className="px-2 py-1 rounded bg-yellow-700 text-yellow-100 text-xs font-bold">Flagged ({data.flags.length})</span>}
            {data?.kycStatus === 'verified' && <span className="px-2 py-1 rounded bg-green-700 text-green-100 text-xs font-bold">Verified</span>}
          </div>
          {data?.verificationBadge && <span className="px-2 py-1 rounded bg-yellow-700 text-yellow-200 text-xs font-semibold mt-2">{data.verificationBadge} Badge</span>}
        </div>
        <div className="w-full text-left text-blue-200">
        {/* Wallet Flagging Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-red-400 mb-2">Flag/Report Wallet or Transaction</h2>
          <div className="text-sm text-blue-300 mb-2">Use this form to professionally report suspicious wallet activity or transactions. Flags help protect the community from scams, phishing, fraud, and other malicious actions. Please provide accurate details for review.</div>
          <form className="flex flex-col gap-2" onSubmit={async e => {
            e.preventDefault();
            setFlagLoading(true);
            setFlagError(null);
            setFlagSuccess(false);
            try {
              const res = await fetch("/api/flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, chain, reason: flagReason, sendAddress: flagSendAddress, receiveAccount: flagReceiveAccount })
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.message || "Failed to flag wallet");
              setFlagSuccess(true);
              setFlagReason("");
              setFlagSendAddress("");
              setFlagReceiveAccount("");
              mutate();
            } catch (err: unknown) {
              setFlagError(err instanceof Error ? err.message : "Unknown error");
            } finally {
              setFlagLoading(false);
            }
          }}>
            <select className="px-3 py-2 rounded border border-red-400" value={flagReason} onChange={e => setFlagReason(e.target.value)} required>
              <option value="">Select reason for flagging</option>
              <option value="Scam">Scam</option>
              <option value="Phishing">Phishing</option>
              <option value="Fraud">Fraud</option>
              <option value="Money Laundering">Money Laundering</option>
              <option value="Stolen Funds">Stolen Funds</option>
              <option value="Suspicious Activity">Suspicious Activity</option>
              <option value="Fake Exchange">Fake Exchange</option>
              <option value="Ransomware">Ransomware</option>
              <option value="Blackmail">Blackmail</option>
              <option value="Other">Other</option>
            </select>
            <input type="text" className="px-3 py-2 rounded border border-blue-400" placeholder="Send Address (if flagging a transaction)" value={flagSendAddress} onChange={e => setFlagSendAddress(e.target.value)} />
            <input type="text" className="px-3 py-2 rounded border border-blue-400" placeholder="Receiving Account (if flagging a transaction)" value={flagReceiveAccount} onChange={e => setFlagReceiveAccount(e.target.value)} />
            <button type="submit" className="px-4 py-2 rounded bg-red-700 text-white font-bold" disabled={flagLoading || !flagReason.trim()}>{flagLoading ? "Flagging..." : "Flag Wallet/Transaction"}</button>
            {flagError && <div className="text-red-400 text-sm">{flagError}</div>}
            {flagSuccess && <div className="text-green-400 text-sm">Flag submitted!</div>}
          </form>
          {data?.flags && data.flags.length > 0 && (
            <div className="mt-2 text-sm text-red-300">This wallet has been flagged {data.flags.length} time{data.flags.length > 1 ? "s" : ""}.</div>
          )}
        </div>
        {/* Community Tab for Admins */}
        {isAdmin && (
          <CommunityTab data={data} address={address} mutate={mutate} />
        )}
          <h2 className="text-lg font-semibold mb-2">Profile Info</h2>
          {editing ? (
            <form className="space-y-3" onSubmit={async e => {
              e.preventDefault();
              setEditLoading(true);
              setEditError(null);
              setEditSuccess(false);
              // --- Field validation ---
              const validation: {[key:string]:string} = {};
              if (!editProfile.displayName.trim()) validation.displayName = "Display name required.";
              if (editProfile.displayName.length > 32) validation.displayName = "Max 32 characters.";
              if (editProfile.bio.length > 160) validation.bio = "Max 160 characters.";
              if (editProfile.avatarUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(editProfile.avatarUrl)) validation.avatarUrl = "Must be a valid image URL.";
              if (editProfile.twitter && !/^@?\w{1,15}$/.test(editProfile.twitter)) validation.twitter = "Invalid Twitter handle.";
              if (editProfile.telegram && !/^@?\w{5,32}$/.test(editProfile.telegram)) validation.telegram = "Invalid Telegram handle.";
              if (editProfile.discord && !/^.{2,32}#[0-9]{4}$/.test(editProfile.discord)) validation.discord = "Invalid Discord tag.";
              if (editProfile.website && editProfile.website.length > 0 && !/^https?:\/\/.+\..+/.test(editProfile.website)) validation.website = "Invalid website URL.";
              setEditValidation(validation);
              if (Object.keys(validation).length > 0) { setEditLoading(false); return; }
              try {
                const res = await fetch('/api/me.patch', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editProfile)
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message || 'Failed to update profile');
                setEditSuccess(true);
                setEditing(false);
                mutate();
              } catch (err: unknown) {
                if (err instanceof Error) {
                  setEditError(err.message || 'Unknown error');
                } else {
                  setEditError('Unknown error');
                }
              } finally {
                setEditLoading(false);
              }
            }}>
              <input type="text" className="w-full px-3 py-2 rounded border" placeholder="Display Name" value={editProfile.displayName} onChange={e => setEditProfile(p => ({ ...p, displayName: e.target.value }))} />
              {editValidation.displayName && <div className="text-red-400 text-sm">{editValidation.displayName}</div>}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-blue-200">Avatar Image</label>
                <input type="file" accept="image/*" onChange={e => {
                  setAvatarError(null);
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 2 * 1024 * 1024) {
                    setAvatarError("Max file size is 2MB.");
                    setAvatarFile(null);
                  } else {
                    setAvatarFile(file);
                  }
                }} />
                {avatarFile && (
                  <Image src={URL.createObjectURL(avatarFile)} alt="preview" width={80} height={80} className="w-20 h-20 rounded-full border-2 border-cyan-400 mt-2" />
                )}
                {avatarError && <div className="text-red-400 text-sm">{avatarError}</div>}
                <button type="button" className="px-3 py-1 rounded bg-blue-700 text-white mt-2" disabled={avatarUploading || !avatarFile} onClick={async()=>{
                  if (!avatarFile) return;
                  setAvatarUploading(true);
                  setAvatarError(null);
                  try {
                    const formData = new FormData();
                    formData.append('avatar', avatarFile);
                    const res = await fetch('/api/avatar-upload', {
                      method: 'POST',
                      body: formData
                    });
                    const result = await res.json();
                    if (!res.ok || !result.url) throw new Error(result.message || 'Upload failed');
                    setEditProfile(p => ({ ...p, avatarUrl: result.url }));
                  } catch (err: unknown) {
                    if (err instanceof Error) {
                      setAvatarError(err.message || 'Upload failed');
                    } else {
                      setAvatarError('Upload failed');
                    }
                  } finally {
                    setAvatarUploading(false);
                  }
                }}>Upload & Use</button>
                {editProfile.avatarUrl && (
                  <div className="mt-2"><span className="font-bold text-blue-200">Avatar URL:</span> <a href={editProfile.avatarUrl} target="_blank" rel="noopener" className="text-blue-400 underline">{editProfile.avatarUrl}</a></div>
                )}
              </div>
              <textarea className="w-full px-3 py-2 rounded border" placeholder="Bio" value={editProfile.bio} onChange={e => setEditProfile(p => ({ ...p, bio: e.target.value }))} />
              {editValidation.bio && <div className="text-red-400 text-sm">{editValidation.bio}</div>}
              {/* KYC-gated fields */}
              {data?.kycStatus === 'verified' ? (
                <>
                  <input type="text" className="w-full px-3 py-2 rounded border" placeholder="Telegram" value={editProfile.telegram} onChange={e => setEditProfile(p => ({ ...p, telegram: e.target.value }))} />
                  {editValidation.telegram && <div className="text-red-400 text-sm">{editValidation.telegram}</div>}
                  <input type="text" className="w-full px-3 py-2 rounded border" placeholder="Twitter" value={editProfile.twitter} onChange={e => setEditProfile(p => ({ ...p, twitter: e.target.value }))} />
                  {editValidation.twitter && <div className="text-red-400 text-sm">{editValidation.twitter}</div>}
                  <input type="text" className="w-full px-3 py-2 rounded border" placeholder="Discord" value={editProfile.discord} onChange={e => setEditProfile(p => ({ ...p, discord: e.target.value }))} />
                  {editValidation.discord && <div className="text-red-400 text-sm">{editValidation.discord}</div>}
                  <input type="text" className="w-full px-3 py-2 rounded border" placeholder="Website" value={editProfile.website} onChange={e => setEditProfile(p => ({ ...p, website: e.target.value }))} />
                  {editValidation.website && <div className="text-red-400 text-sm">{editValidation.website}</div>}
                </>
              ) : (
                <div className="bg-yellow-900 text-yellow-200 rounded p-3 mt-2">KYC verification required to edit socials and website.</div>
              )}
              <div className="flex gap-2 mt-2">
                <button type="submit" className="px-4 py-2 rounded bg-blue-700 text-white font-bold" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white" onClick={() => setEditing(false)} disabled={editLoading}>Cancel</button>
              </div>
              {editError && <div className="text-red-400 mt-2">{editError}</div>}
              {editSuccess && <div className="text-green-400 mt-2">Profile updated!</div>}
            </form>
          ) : (
            <ul className="space-y-1">
              <li><span className="font-bold">Display Name:</span> {data?.displayName || "(Not set)"}</li>
              <li><span className="font-bold">Bio:</span> {data?.bio || "(Not set)"}</li>
              <li><span className="font-bold">Telegram:</span> {data?.telegram ? (
                <a href={`https://t.me/${data.telegram.replace('@','')}`} target="_blank" rel="noopener" className="text-blue-400 underline">@{data.telegram.replace('@','')}</a>
              ) : "(Not set)"}</li>
              <li><span className="font-bold">Twitter:</span> {data?.twitter ? (
                <a href={`https://twitter.com/${data.twitter.replace('@','')}`} target="_blank" rel="noopener" className="text-blue-400 underline">@{data.twitter.replace('@','')}</a>
              ) : "(Not set)"}</li>
              <li><span className="font-bold">Discord:</span> {data?.discord ? (
                <span className="text-indigo-400">{data.discord}</span>
              ) : "(Not set)"}</li>
              <li><span className="font-bold">Website:</span> {data?.website ? (
                <a href={data.website} target="_blank" rel="noopener" className="text-blue-400 underline">{data.website}</a>
              ) : "(Not set)"}</li>
            </ul>
          )}
          {!editing && <button className="mt-4 px-4 py-2 rounded bg-blue-700 text-white font-bold" onClick={startEdit}>Edit Profile</button>}
        </div>
        {data?.kycStatus && (
          <div className="mt-4 w-full text-left">
            <span className="font-bold text-cyan-300">KYC Status:</span> <span className="text-cyan-200">{data.kycStatus}</span>
          </div>
        )}
        {data?.donationRequests && data.donationRequests.length > 0 && (
          <div className="mt-4 w-full text-left">
            <h3 className="text-cyan-300 font-semibold mb-2">Donation Requests</h3>
            <ul className="space-y-2">
              {data.donationRequests.map((donation: DonationRequest, i: number) => (
                <li key={i} className="bg-blue-950 border border-blue-800 rounded-lg p-2">
                  <span className="text-cyan-200 font-mono">{donation.platform}</span> - <a href={donation.url} target="_blank" rel="noopener" className="text-blue-400 underline">{donation.url}</a>
                  <div className="text-cyan-400">{donation.description}</div>
                  <span className="text-xs text-cyan-500">Expires: {donation.expiresAt ? new Date(donation.expiresAt).toLocaleString() : 'N/A'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Donation Button */}
        {!hasActiveDonation && (
          <div className="mt-4 w-full text-left">
            <button className="px-4 py-2 rounded bg-green-700 text-white font-bold" onClick={() => router.push(`/donate?address=${address}&chain=${chain}`)}>
              Request Donation
            </button>
          </div>
        )}
        {/* Recent Transactions (always shown if available) */}
        {data?.transactions && data.transactions.length > 0 && (
          <div className="mt-6 w-full text-left">
            <h3 className="text-cyan-300 font-semibold mb-2">Recent Transactions</h3>
            <ul className="space-y-2">
              {data.transactions.map((tx: import('lib/types').Transaction, i: number) => (
                <li key={i} className="bg-gray-900 border border-blue-700 rounded-lg p-2">
                  <span className="text-cyan-200 font-mono">{tx.txid || tx.hash}</span>
                  <div className="text-cyan-400">From: {tx.from} To: {tx.to} Value: {tx.value}</div>
                  <span className="text-xs text-cyan-500">Date: {tx.date ? new Date(tx.date).toLocaleString() : 'N/A'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
                
