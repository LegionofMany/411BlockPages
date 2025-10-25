export default function Features() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
      <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="40">
        <div className="flex items-start gap-3 mb-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M12 2v6" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 12h12" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 18v4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-blue-300 text-xl md:text-2xl font-semibold">Multi-Chain</span>
        </div>
        <p className="text-muted text-sm">Supports Ethereum, Polygon, BNB, Solana, Avalanche, Bitcoin, Cardano, Tron, XRP and more.</p>
      </div>
  <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="80">
        <div className="flex items-start gap-3 mb-3 reveal">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 17.3L6.6 20l1.1-6.4L2 9.2l6.5-.9L12 2l3.5 6.3L22 9.2l-5.7 4.4L17.4 20z" stroke="#f59e42" strokeWidth="0.6" fill="#fbbf24" />
          </svg>
          <span className="text-yellow-400 text-xl md:text-2xl font-semibold">Star Ratings</span>
        </div>
        <p className="text-muted text-sm">Rate and review wallets for trust and transparency.</p>
      </div>
  <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="120">
        <div className="flex items-start gap-3 mb-3 reveal">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3" fill="#fb7185" />
            <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" stroke="#f472b6" strokeWidth="1" fill="none" />
          </svg>
          <span className="text-pink-400 text-xl md:text-2xl font-semibold">Social Profiles</span>
        </div>
        <p className="text-muted text-sm">Connect your social accounts for a richer blockchain identity.</p>
      </div>
  <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="160">
        <div className="flex items-start gap-3 mb-3 reveal">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="7" width="18" height="12" rx="2" stroke="#22c55e" strokeWidth="1.2" />
            <path d="M7 11l3 3 7-7" stroke="#16a34a" strokeWidth="1.4" fill="none" />
          </svg>
          <span className="text-green-400 text-xl md:text-2xl font-semibold">KYC & Verification</span>
        </div>
        <p className="text-muted text-sm">Advanced KYC and verification for secure interactions.</p>
      </div>
  <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="200">
        <div className="flex items-start gap-3 mb-3 reveal">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v10" stroke="#7c3aed" strokeWidth="1.5" />
            <path d="M8 7h8" stroke="#a78bfa" strokeWidth="1.5" />
          </svg>
          <span className="text-indigo-400 text-xl md:text-2xl font-semibold">Donation Requests</span>
        </div>
        <p className="text-muted text-sm">Request and manage donations directly from your wallet profile.</p>
      </div>
  <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="240">
        <div className="flex items-start gap-3 mb-3 reveal">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3 5 5 .7-3.6 3.1L18 20l-6-3.2L6 20l.6-8.2L3 9.7 8 9z" fill="#fb7185" />
          </svg>
          <span className="text-red-400 text-xl md:text-2xl font-semibold">Moderation</span>
        </div>
        <p className="text-muted text-sm">Community-driven moderation for safer blockchain interactions.</p>
      </div>
  <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="280">
        <div className="flex items-start gap-3 mb-3 reveal">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3" fill="#a78bfa" />
            <rect x="4" y="12" width="16" height="6" rx="2" fill="#c4b5fd" />
          </svg>
          <span className="text-purple-400 text-xl md:text-2xl font-semibold">Avatar Upload</span>
        </div>
        <p className="text-muted text-sm">Personalize your wallet profile with custom avatars.</p>
      </div>
      <div className="glass rounded-xl shadow-lg p-5 md:p-6 border border-blue-800 reveal" data-delay="320">
        <div className="flex items-start gap-3 mb-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M4 12l4-8 12 12-4 8-12-12z" stroke="#06b6d4" strokeWidth="1.2" fill="#5eead4" />
          </svg>
          <span className="text-teal-400 text-xl md:text-2xl font-semibold">Wallet Tags</span>
        </div>
        <p className="text-muted text-sm">Organize and categorize wallets with custom tags.</p>
      </div>
    </div>
  );
}
