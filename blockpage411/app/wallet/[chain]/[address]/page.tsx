

"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { useState } from "react";
import axios from "axios";

import Image from "next/image";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { Flag, Transaction, UserProfile } from "../../../../lib/types";
type DonationRequest = {
  platform: string;
  url: string;
  description?: string;
  active: boolean;
  createdAt?: string | Date;
};

// Type guard and helpers for XRP transaction shape
type XrpTx = {
  tx_hash?: string;
  hash?: string;
  tx_type?: string;
  type?: string;
  tx_date?: string;
  date?: string;
  amount?: string;
  value?: string;
};

function isXrpTx(tx: unknown): tx is XrpTx {
  return typeof tx === 'object' && tx !== null && (
    'tx_hash' in tx || 'hash' in tx || 'tx_type' in tx || 'type' in tx || 'tx_date' in tx || 'date' in tx || 'amount' in tx || 'value' in tx
  );
}

function getXrpHash(tx: Transaction | XrpTx) {
  if (isXrpTx(tx)) {
    if (typeof tx.hash === 'string') return tx.hash.slice(0, 10);
    if (typeof tx.tx_hash === 'string') return tx.tx_hash.slice(0, 10);
  }
  return 'N/A';
}
function getXrpType(tx: Transaction | XrpTx) {
  if (isXrpTx(tx)) {
    if (typeof tx.type === 'string') return tx.type;
    if (typeof tx.tx_type === 'string') return tx.tx_type;
  }
  return 'N/A';
}
function getXrpDate(tx: Transaction | XrpTx) {
  if (isXrpTx(tx)) {
    if (typeof tx.date === 'string') return tx.date;
    if (typeof tx.tx_date === 'string') return tx.tx_date;
  }
  return 'N/A';
}
function getXrpAmount(tx: Transaction | XrpTx) {
  if (isXrpTx(tx)) {
    if (tx.amount) return tx.amount;
    if (tx.value) return tx.value;
  }
  return 'N/A';
}


const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WalletProfile() {
  const params = useParams();
  const chain = typeof params?.chain === 'string' ? params.chain : Array.isArray(params?.chain) ? params.chain[0] : '';
  const address = typeof params?.address === 'string' ? params.address : Array.isArray(params?.address) ? params.address[0] : '';
  const { data, error, isLoading, mutate } = useSWR<UserProfile & { chain?: string; ens?: string; nftCount?: number; avgRating?: number; flags?: Flag[]; transactions?: Transaction[]; verificationBadge?: string }>(
    chain && address ? `/api/wallet/${chain}/${address}` : null,
    fetcher
  );
  const [flagReason, setFlagReason] = useState("");
  const [flagMsg, setFlagMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [rateMsg, setRateMsg] = useState("");
  // v3 UI state
  const [tab, setTab] = useState<'profile'|'donations'|'kyc'>('profile');
  const [kycMsg, setKycMsg] = useState("");
  const [donationMsg, setDonationMsg] = useState("");
  const [donationForm, setDonationForm] = useState<DonationRequest>({ platform: '', url: '', description: '', active: true });
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [profileMsg, setProfileMsg] = useState("");

  async function handleFlag() {
    setFlagMsg("");
    try {
      await axios.post("/api/flags", { address, chain, reason: flagReason });
      setFlagMsg("Flag submitted");
      setFlagReason("");
      mutate();
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const errorResponse = e.response as { data?: { message?: string } };
        setFlagMsg(errorResponse.data?.message || "Error");
      } else {
        setFlagMsg("An unexpected error occurred.");
      }
    }
  }

  async function handleRate() {
    setRateMsg("");
    try {
      await axios.post("/api/ratings", { address, chain, score: rating });
      setRateMsg("Rating submitted");
      setRating(0);
      mutate();
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const errorResponse = e.response as { data?: { message?: string } };
        setRateMsg(errorResponse.data?.message || "Error");
      } else {
        setRateMsg("An unexpected error occurred.");
      }
    }
  }

  if (isLoading) return <div className="p-8 text-center text-lg text-cyan-100" aria-busy="true">Loading wallet profile...</div>;
  if (error) return <div className="p-8 text-center text-red-400 font-semibold" role="alert">Error loading wallet</div>;
  if (!data) return <div className="p-8 text-center text-cyan-200">No wallet data found.</div>;

  return (
    <div className="min-h-screen bg-blockchain-gradient flex flex-col text-cyan-100">
      <Navbar variant="wallet" />
      <main className="flex-1 flex items-center justify-center py-4 px-2 sm:px-0">
        <section className="w-full max-w-2xl card flex flex-col gap-8 animate-fade-in">
          {/* Tabs */}
          <nav
            className="flex flex-row sm:flex-row gap-4 border-b border-blue-200 mb-6 mt-4 justify-center z-10 relative bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 rounded-xl shadow-lg p-2"
            style={{ marginTop: '2.5rem' }}
          >
            <button
              className={`tab ${tab==='profile'?'tab-active':''}`}
              style={{ minWidth: 100, marginBottom: 4 }}
              onClick={()=>setTab('profile')}
            >Profile</button>
            <button
              className={`tab ${tab==='donations'?'tab-active':''}`}
              style={{ minWidth: 100, marginBottom: 4 }}
              onClick={()=>setTab('donations')}
            >Donations</button>
            <button
              className={`tab ${tab==='kyc'?'tab-active':''}`}
              style={{ minWidth: 100, marginBottom: 4 }}
              onClick={()=>setTab('kyc')}
            >KYC</button>
          </nav>
          {/* Profile Tab */}
          {tab==='profile' && (
            <div className="flex flex-col gap-6">
              {/* Profile Header */}
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-200 pb-4 w-full">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 break-all sm:break-words truncate" aria-label="Wallet address">
                    <span className="text-blue-300 text-3xl" aria-hidden="true">👛</span>
                    <span className="truncate block max-w-full" title={data.address}>{data.address}</span>
                  </h1>
                  <div className="text-cyan-100 text-sm mt-1 whitespace-normal break-words">
                    {data.chain ? `${data.chain.charAt(0).toUpperCase() + data.chain.slice(1)} Wallet Profile` : "Wallet Profile"}
                  </div>
                  {data.ens && (
                    <div className="text-blue-200 text-xs mt-1" aria-label="ENS name">ENS: {data.ens}</div>
                  )}
                  {typeof data.nftCount === 'number' && data.chain === 'ethereum' && (
                    <div className="text-purple-300 text-xs mt-1" aria-label="NFT count">NFTs: {data.nftCount}</div>
                  )}
                  {/* v3: Display name, avatar, bio, socials, phone apps, verification badge/score */}
                  <div className="mt-2 flex items-center gap-2">
                    {data.avatarUrl && (
                      <Image
                        src={data.avatarUrl}
                        alt="avatar"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border-2 border-blue-400 object-cover"
                        style={{ objectFit: 'cover' }}
                        priority
                        unoptimized={data.avatarUrl.startsWith('http')}
                      />
                    )}
                    <span className="text-lg font-bold text-cyan-100">{data.displayName}</span>
                    {data.verificationBadge && <span className="badge bg-gradient-to-r from-yellow-400 to-blue-400 text-white ml-2">{data.verificationBadge} Badge</span>}
                    {typeof data.verificationScore === 'number' && <span className="text-xs text-cyan-200 ml-2">Score: {data.verificationScore}</span>}
                  </div>
                  {data.bio && <div className="text-cyan-200 text-sm mt-1">{data.bio}</div>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.telegram && <a href={`https://t.me/${data.telegram.replace('@','')}`} className="badge bg-blue-500 text-white" target="_blank" rel="noopener">Telegram</a>}
                    {data.whatsapp && <a href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}`} className="badge bg-green-600 text-white" target="_blank" rel="noopener">WhatsApp</a>}
                    {data.twitter && <a href={`https://twitter.com/${data.twitter.replace('@','')}`} className="badge bg-blue-400 text-white" target="_blank" rel="noopener">Twitter</a>}
                    {data.facebook && <a href={`https://facebook.com/${data.facebook}`} className="badge bg-blue-800 text-white" target="_blank" rel="noopener">Facebook</a>}
                    {data.instagram && <a href={`https://instagram.com/${data.instagram}`} className="badge bg-pink-500 text-white" target="_blank" rel="noopener">Instagram</a>}
                    {data.linkedin && <a href={`https://linkedin.com/in/${data.linkedin}`} className="badge bg-blue-700 text-white" target="_blank" rel="noopener">LinkedIn</a>}
                    {data.discord && <span className="badge bg-indigo-500 text-white">Discord: {data.discord}</span>}
                    {data.website && <a href={data.website} className="badge bg-green-500 text-white" target="_blank" rel="noopener">Website</a>}
                    {data.phoneApps && data.phoneApps.map((app: string, i: number) => <span key={i} className="badge bg-gray-700 text-white">{app}</span>)}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-1 mb-1" aria-label="Average rating">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className={
                        (data.avgRating ?? 0) >= n
                          ? 'text-yellow-400 text-2xl'
                          : (data.avgRating ?? 0) >= n - 0.5
                            ? 'text-yellow-300 text-2xl'
                            : 'text-gray-600 text-2xl'
                      }>
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-lg font-bold text-yellow-200">{data.avgRating?.toFixed(2) || 0}</span>
                  </div>
                  <span className="text-xs text-cyan-100">Avg. Rating</span>
                  <button className="btn-primary mt-2" onClick={()=>{setEditMode(!editMode); setProfileForm(data); setProfileMsg("");}}>{editMode ? 'Cancel' : 'Edit Profile'}</button>
                </div>
              </header>
              {editMode && (
                <form className="flex flex-col gap-2 bg-gray-900/60 p-4 rounded-lg border border-blue-300" onSubmit={async e => {
                  e.preventDefault();
                  setProfileMsg("");
                  try {
                    await axios.patch('/api/me.patch.ts', profileForm);
                    setProfileMsg("Profile updated!");
                    setEditMode(false);
                    mutate();
                  } catch (err: unknown) {
                    if (typeof err === 'object' && err !== null && 'response' in err) {
                      const errorResponse = (err as { response?: { data?: { message?: string } } }).response;
                      setProfileMsg(errorResponse?.data?.message || "Error updating profile");
                    } else {
                      setProfileMsg("Error updating profile");
                    }
                  }
                }}>
                  <input className="input" placeholder="Display Name" value={profileForm.displayName||''} onChange={e=>setProfileForm({...profileForm, displayName:e.target.value})} />
                  <input className="input" placeholder="Avatar URL" value={profileForm.avatarUrl||''} onChange={e=>setProfileForm({...profileForm, avatarUrl:e.target.value})} />
                  <textarea className="input" placeholder="Bio" value={profileForm.bio||''} onChange={e=>setProfileForm({...profileForm, bio:e.target.value})} />
                  <input className="input" placeholder="Telegram" value={profileForm.telegram||''} onChange={e=>setProfileForm({...profileForm, telegram:e.target.value})} />
                  <input className="input" placeholder="WhatsApp (phone or username)" value={profileForm.whatsapp||''} onChange={e=>setProfileForm({...profileForm, whatsapp:e.target.value})} />
                  <input className="input" placeholder="Twitter" value={profileForm.twitter||''} onChange={e=>setProfileForm({...profileForm, twitter:e.target.value})} />
                  <input className="input" placeholder="Facebook (username or id)" value={profileForm.facebook||''} onChange={e=>setProfileForm({...profileForm, facebook:e.target.value})} />
                  <input className="input" placeholder="Instagram (username)" value={profileForm.instagram||''} onChange={e=>setProfileForm({...profileForm, instagram:e.target.value})} />
                  <input className="input" placeholder="LinkedIn (username)" value={profileForm.linkedin||''} onChange={e=>setProfileForm({...profileForm, linkedin:e.target.value})} />
                  <input className="input" placeholder="Discord" value={profileForm.discord||''} onChange={e=>setProfileForm({...profileForm, discord:e.target.value})} />
                  <input className="input" placeholder="Website" value={profileForm.website||''} onChange={e=>setProfileForm({...profileForm, website:e.target.value})} />
                  <input className="input" placeholder="Phone Apps (comma separated)" value={profileForm.phoneApps?.join(',')||''} onChange={e=>setProfileForm({...profileForm, phoneApps:e.target.value.split(',').map((s:string)=>s.trim())})} />
                  <button className="btn-primary mt-2" type="submit">Save</button>
                  {profileMsg && <div className="text-xs mt-1 text-green-400">{profileMsg}</div>}
                </form>
              )}
            </div>
          )}
          {/* Donations Tab */}
          {tab==='donations' && (
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-lg text-green-400 flex items-center gap-2 mb-1"><span aria-hidden="true">💸</span> Donation Requests</h2>
              <ul className="space-y-2">
                {data.donationRequests?.length ? (
                  <>
                    {(data.donationRequests as DonationRequest[]).filter((d)=>d.active).map((d,i)=>(
                      <li key={i} className="bg-green-900/40 border-l-4 border-green-400 px-3 py-2 rounded flex flex-col">
                        <span className="font-bold text-green-200">{d.platform}</span>
                        <span className="text-green-100">{d.description}</span>
                        <a href={d.url} className="text-green-300 underline" target="_blank" rel="noopener">{d.url}</a>
                        {d.createdAt && <span className="text-xs text-green-300 mt-1">Created: {new Date(d.createdAt).toLocaleDateString()}</span>}
                      </li>
                    ))}
                    {(data.donationRequests as DonationRequest[]).filter((d)=>!d.active).map((d,i)=>(
                      <li key={i+1000} className="bg-gray-800/40 border-l-4 border-gray-400 px-3 py-2 rounded flex flex-col opacity-60">
                        <span className="font-bold text-gray-300">{d.platform}</span>
                        <span className="text-gray-200">{d.description}</span>
                        <a href={d.url} className="text-gray-400 underline" target="_blank" rel="noopener">{d.url}</a>
                        {d.createdAt && <span className="text-xs text-gray-400 mt-1">Expired: {new Date(d.createdAt).toLocaleDateString()}</span>}
                      </li>
                    ))}
                  </>
                ) : <li className="text-xs text-cyan-200">No donation requests.</li>}
              </ul>
              <form className="flex flex-col gap-2 bg-gray-900/60 p-4 rounded-lg border border-green-300" onSubmit={async e => {
                e.preventDefault();
                setDonationMsg("");
                try {
                  await axios.post('/api/donation-request.ts', donationForm);
                  setDonationMsg("Donation request added!");
                  setDonationForm({ platform: '', url: '', description: '', active: true });
                  mutate();
                } catch (err: unknown) {
                  if (typeof err === 'object' && err !== null && 'response' in err) {
                    const errorResponse = (err as { response?: { data?: { message?: string } } }).response;
                    setDonationMsg(errorResponse?.data?.message || "Error adding donation");
                  } else {
                    setDonationMsg("Error adding donation");
                  }
                }
              }}>
                <input className="input" placeholder="Platform (e.g. Gitcoin)" value={donationForm.platform} onChange={e=>setDonationForm({...donationForm, platform:e.target.value})} />
                <input className="input" placeholder="Donation URL" value={donationForm.url} onChange={e=>setDonationForm({...donationForm, url:e.target.value})} />
                <input className="input" placeholder="Description" value={donationForm.description} onChange={e=>setDonationForm({...donationForm, description:e.target.value})} />
                <button className="btn-primary mt-2" type="submit">Add Donation Request</button>
                {donationMsg && <div className="text-xs mt-1 text-green-400">{donationMsg}</div>}
              </form>
            </div>
          )}
          {/* KYC Tab */}
          {tab==='kyc' && (
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-lg text-blue-400 flex items-center gap-2 mb-1"><span aria-hidden="true">🛡️</span> KYC Verification</h2>
              <div className="text-cyan-100">KYC Status: <span className="font-bold">{data.kycStatus}</span></div>
              {data.kycStatus === 'unverified' && (
                <button className="btn-primary bg-blue-600 hover:bg-blue-700 w-fit" onClick={async()=>{
                  setKycMsg("");
                  try {
                    await axios.post('/api/kyc-request.ts');
                    setKycMsg("KYC request submitted!");
                    mutate();
                  } catch (err: unknown) {
                    if (typeof err === 'object' && err !== null && 'response' in err) {
                      const errorResponse = (err as { response?: { data?: { message?: string } } }).response;
                      setKycMsg(errorResponse?.data?.message || "Error submitting KYC request");
                    } else {
                      setKycMsg("Error submitting KYC request");
                    }
                  }
                }}>Request KYC Verification</button>
              )}
              {data.kycStatus === 'pending' && <div className="text-yellow-300">KYC verification pending...</div>}
              {data.kycStatus === 'verified' && <div className="text-green-400">KYC verified! You can now edit all profile fields.</div>}
              {data.kycStatus === 'rejected' && <div className="text-red-400">KYC rejected. Please contact support.</div>}
              {kycMsg && <div className="text-xs mt-1 text-blue-400">{kycMsg}</div>}
            </div>
          )}

          {/* Flags Section */}
          <section className="flex flex-col gap-2" aria-labelledby="flags-heading">
            <h2 id="flags-heading" className="font-semibold text-lg text-red-400 flex items-center gap-2 mb-1">
              <span aria-hidden="true">🚩</span> Flags
            </h2>
            <ul className="mb-2 space-y-1" aria-live="polite">
              {data.flags?.length ? data.flags.map((f: Flag, i: number) => (
                <li key={i} className="text-sm text-red-200 bg-red-900/40 border-l-4 border-red-400 px-3 py-1 rounded">
                  <span className="font-medium text-red-300">{f.reason}</span> <span className="text-cyan-100">by {f.user.slice(0, 8)}... on {new Date(f.date).toISOString().slice(0,10)}</span>
                </li>
              )) : <li className="text-xs text-cyan-200">No flags for this wallet.</li>}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch mt-2 w-full">
              <select
                className="px-4 py-3 rounded-xl bg-gray-900 border-2 border-red-400 text-red-200 focus:outline-none focus:ring-4 focus:ring-red-300 mb-2 sm:mb-0 w-full sm:w-1/3 text-base font-semibold transition-all duration-200"
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                aria-label="Flag type"
              >
                <option value="">Select flag type</option>
                <option value="scam">Scam</option>
                <option value="spam">Spam</option>
                <option value="phishing">Phishing</option>
                <option value="malware">Malware</option>
                <option value="other">Other</option>
              </select>
              <textarea
                className="flex-1 px-4 py-3 rounded-xl text-white bg-gray-900 border-2 border-red-400 focus:outline-none focus:ring-4 focus:ring-red-300 min-h-[56px] w-full text-base font-semibold transition-all duration-200"
                placeholder="Describe the issue (details, links, etc.)"
                value={flagMsg}
                onChange={e => setFlagMsg(e.target.value)}
                aria-label="Flag details"
              />
              <button className="btn-primary bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 focus:ring-4 focus:ring-red-300 focus:outline-none mt-2 sm:mt-0 text-base sm:text-lg active:scale-95" onClick={handleFlag}>
                Flag Wallet
              </button>
            </div>
            {flagMsg && <div className="text-xs mt-1 text-red-400">{flagMsg}</div>}
          </section>

          {/* Rating Section */}
          <section className="flex flex-col gap-2" aria-labelledby="rating-heading">
            <h2 id="rating-heading" className="font-semibold text-lg text-yellow-400 flex items-center gap-2 mb-1">
              <span aria-hidden="true">⭐</span> Rate this wallet
            </h2>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={`text-3xl focus:outline-none transition-colors ${rating >= n ? 'text-yellow-400' : 'text-cyan-100'} hover:text-yellow-500`}
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                  tabIndex={0}
                >★</button>
              ))}
            </div>
            <button className="btn-primary bg-green-600 hover:bg-green-700 w-fit" onClick={handleRate}>
              Submit Rating
            </button>
            {rateMsg && <div className="text-xs mt-1 text-green-400">{rateMsg}</div>}
          </section>

          {/* Transactions Section */}
          <section className="flex flex-col gap-2" aria-labelledby="tx-heading">
            <h2 id="tx-heading" className="font-semibold text-lg text-blue-300 flex items-center gap-2 mb-1">
              <span aria-hidden="true">📄</span> Recent Transactions
            </h2>
            <ul className="max-h-56 overflow-y-auto divide-y divide-blue-200 bg-gray-900/60 rounded-lg border border-blue-200" aria-live="polite">
              {data.transactions?.length ? data.transactions.slice(0, 10).map((tx: Transaction, i: number) => (
                <li key={i} className="text-xs px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 text-cyan-100">
                  {data.chain === 'bitcoin' ? (
                    <>
                      <span className="font-mono text-cyan-100">Txid: {tx.txid?.slice(0, 10)}...</span>
                      <span className="text-cyan-200">Block: {tx.status?.block_height || 'N/A'}</span>
                      <span className="text-blue-300 font-semibold">{Array.isArray(tx.vout) ? tx.vout.length : 0} outputs</span>
                      {Array.isArray(tx.vout) && tx.vout.length > 0 && (
                        <ul className="ml-2 mt-1 text-cyan-200">
                          {tx.vout.map((v, idx) => (
                            <li key={idx} className="flex flex-row gap-2">
                              <span>To: {v.scriptpubkey_address?.slice(0, 12)}...</span>
                              <span>Value: {v.value} sats</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : data.chain === 'xrp' ? (
                    <>
                      <span className="font-mono text-cyan-100">
                        Hash: {getXrpHash(tx)}...
                      </span>
                      <span className="text-cyan-200">
                        Type: {getXrpType(tx)}
                      </span>
                      <span className="text-cyan-200">
                        Date: {getXrpDate(tx)}
                      </span>
                      <span className="text-blue-300 font-semibold">
                        Amount: {getXrpAmount(tx)} XRP
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-cyan-100">Hash: {tx.hash?.slice(0, 10)}...</span>
                      <span className="text-cyan-200">From: {tx.from?.slice(0, 8)}...</span>
                      <span className="text-cyan-200">To: {tx.to?.slice(0, 8)}...</span>
                      <span className="text-blue-300 font-semibold">{Number(tx.value) / 1e18} {data.chain === 'polygon' ? 'MATIC' : data.chain === 'bsc' ? 'BNB' : 'ETH'}</span>
                    </>
                  )}
                </li>
              )) : <li className="text-xs text-cyan-200 px-3 py-2">No transactions found.</li>}
            </ul>
          </section>
        </section>
      </main>
      {/* Animation keyframes */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 640px) {
          .max-w-2xl { max-width: 100vw; border-radius: 0; box-shadow: none; }
          .p-8 { padding: 1rem !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
