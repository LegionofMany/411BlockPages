"use client";
import Image from "next/image";
import useProfile from "../../hooks/useProfile";

export default function UserProfile() {
  const { profile: user, loading, error } = useProfile();

  if (loading) {
    return <div className="text-center py-8 text-cyan-200">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <section className="w-full max-w-2xl mx-auto text-center py-16 animate-fade-in">
      <div className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
        <Image
          src={typeof user.avatarUrl === 'string' && user.avatarUrl ? user.avatarUrl : "/logos/ethereum.png"}
          alt="User Avatar"
          width={80}
          height={80}
          className="rounded-full mb-4 mx-auto border-4 border-amber-400/80 shadow-amber-300/20 shadow-lg"
        />
  <h3 className="text-2xl font-bold text-slate-100">{typeof user.username === 'string' && user.username ? user.username : 'Anonymous User'}</h3>
  <p className="text-sm text-slate-400 font-mono mb-4 break-all">{typeof user.address === 'string' ? user.address : ''}</p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className="badge bg-green-500/20 text-green-300 border border-green-400/30">
            {typeof user.kycStatus === 'string' && user.kycStatus ? user.kycStatus : 'KYC Pending'}
          </span>
          <span className="badge bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
            {user.rating ? `${user.rating} ★` : "No Rating"}
          </span>
          <span className="badge bg-purple-500/20 text-purple-300 border border-purple-400/30">
            {typeof user.verificationBadge === 'string' && user.verificationBadge ? user.verificationBadge : ''}
          </span>
          <span className="badge bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Score: {typeof user.verificationScore === 'number'
              ? user.verificationScore
              : (typeof user.verificationScore === 'string' && user.verificationScore ? Number(user.verificationScore) : 0)}
          </span>
        </div>

        {Array.isArray(user.socials) && (user.socials as unknown[]).length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {(user.socials as unknown[]).filter(s => typeof s === 'string').map((s) => (
              <span key={String(s)} className="text-slate-300 hover:text-amber-400 transition-colors">
                {String(s)}
              </span>
            ))}
          </div>
        )}

        {(typeof user.donation === 'string' || typeof user.donation === 'number') && (
          <div className="text-center">
            <span className="text-slate-300 text-sm">Donation Request:</span>
            <p className="font-bold text-green-400 text-lg">{String(user.donation)}</p>
          </div>
        )}
      </div>
    </section>
  );
}