import React, { useEffect, useState } from 'react';
import ThemeProvider from '../../app/components/ThemeProvider';
import Navbar from '../../app/components/Navbar';
import Footer from '../../app/components/Footer';
import WalletDetails from '../../components/wallet/WalletDetails';
import SocialLinksForm from '../../components/wallet/SocialLinksForm';
import NftAvatarPreview from '../../components/wallet/NftAvatarPreview';

type SocialLinks = {
  twitter?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  linkedin?: string;
  discord?: string;
  website?: string;
};

export default function WalletSocialsPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [socials, setSocials] = useState<SocialLinks | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [udDomain, setUdDomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('wallet');
    setWalletAddress(stored || null);

    (async () => {
      try {
        const res = await fetch('/api/profile/social-links', { credentials: 'include' });
        if (!res.ok) return;
        const js = await res.json();
        setSocials({
          twitter: js.twitter || '',
          instagram: js.instagram || '',
          telegram: js.telegram || '',
          whatsapp: js.whatsapp || '',
          linkedin: js.linkedin || '',
          discord: js.discord || '',
          website: js.website || '',
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleDisconnect = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem('wallet');
    } catch {
      // ignore
    }
    setWalletAddress(null);
    setEnsName(null);
    setUdDomain(null);
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <Navbar />
        <main
          className="flex-1 w-full max-w-5xl mx-auto rounded-3xl px-4 pb-10 pt-24 sm:px-6 lg:px-8"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(16,185,129,0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(6,95,70,0.6), #020617 70%)',
          }}
        >
          <header className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80 mb-1">
              Wallet &amp; socials
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-50">Wallet identity &amp; socials</h1>
            <p className="mt-1 max-w-xl text-xs text-amber-100/80">
              Manage your connected wallet, social profiles, and NFT avatar in one place. This page powers your public profile and trust signals.
            </p>
          </header>

          <div className="space-y-5">
            <WalletDetails
              address={walletAddress}
              ensName={ensName}
              udDomain={udDomain}
              onDisconnect={walletAddress ? handleDisconnect : undefined}
            />
            <SocialLinksForm initial={socials || undefined} />
            <NftAvatarPreview imageUrl={null} />
          </div>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
