"use client";
import React, { useState, useEffect } from 'react';
import ProviderSelect from 'app/components/ProviderSelect';
import AddProviderModal from 'app/components/AddProviderModal';
import ReportModal from 'app/components/ReportModal';
import { useRouter } from 'next/navigation';
import { openAuthModal } from '../components/auth/openAuthModal';

type ProviderType = { _id?: string; name: string; website?: string; type?: string; rank?: number; status?: string };

export default function SearchPage() {
  const router = useRouter();
  const [myWallet, setMyWallet] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [provider, setProvider] = useState<ProviderType | null>(null);
  const [pendingProviderName, setPendingProviderName] = useState<string | null>(null);
  const [suspect, setSuspect] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);
  // avoid reading localStorage during render to prevent SSR/hydration mismatches
  const [showProviderFeatures, setShowProviderFeatures] = useState<boolean>(false);
  useEffect(() => {
    try {
      const val = localStorage.getItem('showProviderFeatures');
      if (val !== null) setShowProviderFeatures(val !== 'false');
      else setShowProviderFeatures(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const [openReportModal, setOpenReportModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nftAvatarUrl, setNftAvatarUrl] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  async function signAndVerify() {
    // Unified flow: use the /login wallet-connection + nonce verification.
    // This avoids dead buttons on mobile and keeps wallet auth in one place.
    openAuthModal({
      title: 'Verify wallet',
      message: 'Verify your wallet to unlock reporting, flagging, rating, and follow actions.',
      redirectTo: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
      ctaLabel: 'Continue to sign in',
    });
  }

  // ensure main content is interactive (in case a leftover navbar mobile-drawer side-effect disabled it)
  function restoreMainInteractivity() {
    try{
      const main = document.getElementById('content');
      if (main) {
        main.removeAttribute('aria-hidden');
        (main as HTMLElement).style.pointerEvents = '';
        (main as HTMLElement).style.userSelect = '';
        (main as HTMLElement).style.touchAction = '';
      }
      neutralizeStaleOverlays();
    }catch(e){}
  }

  // defensive: if any full-screen overlay was left in the DOM (e.g., mobile drawer backdrop), make it non-interactive so page buttons work
  function neutralizeStaleOverlays() {
    try{
      const children = Array.from(document.body.children) as HTMLElement[];
      children.forEach((el)=>{
        try{
          const cs = window.getComputedStyle(el);
          const z = Number(cs.zIndex) || 0;
          const pos = cs.position || '';
          const insetTop = cs.top || '';
          const insetRight = cs.right || '';
          const insetBottom = cs.bottom || '';
          const insetLeft = cs.left || '';
          const isFull = pos === 'fixed' && (insetTop === '0px' || insetTop === '0') && (insetRight === '0px' || insetRight === '0') && (insetBottom === '0px' || insetBottom === '0') && (insetLeft === '0px' || insetLeft === '0');
          // skip elements that we intentionally created for modals/dropdowns (they include data-test-id)
          const hasTestId = el.hasAttribute && el.hasAttribute('data-test-id');
          if (isFull && z > 10000 && !hasTestId) {
            el.style.pointerEvents = 'none';
            // keep visible but non-blocking
          }
        }catch(e){}
      });
    }catch(e){}
  }

  React.useEffect(() => { restoreMainInteractivity(); }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const statusRes = await fetch('/api/auth/status', { credentials: 'include', cache: 'no-store' });
        const status = await statusRes.json().catch(() => ({} as any));
        if (!cancelled) setAuthenticated(Boolean(status?.authenticated));
        if (!status?.authenticated) return;

        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.nftAvatarUrl) setNftAvatarUrl(data.nftAvatarUrl);
      } catch {
        // ignore
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#020617",
        backgroundImage:
          "radial-gradient(circle_at_top,_rgba(15,23,42,0.9),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),transparent_55%)",
        color: "#e5e7eb",
      }}
    >
      <header className="sticky top-0 z-20 bg-black/70 backdrop-blur border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-base sm:text-lg md:text-xl font-semibold tracking-tight drop-shadow-[0_0_16px_rgba(250,204,21,0.45)]"
              style={{ color: "rgba(252,211,77,0.96)" }}
            >
              Search &amp; report counterparties
            </h1>
            <p className="text-xs md:text-sm mt-1" style={{ color: "#e5e7eb" }}>
              Look up a wallet, link a provider, and send high-signal reports into the reputation graph.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 px-3.5 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-px transition-transform transition-shadow"
            onClick={signAndVerify}
          >
            Verify my wallet
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div
          id="content"
          className="w-full px-4 py-8 md:py-12 flex flex-col items-stretch lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:gap-10"
          style={{ maxWidth: "72rem", margin: "0 auto" }}
        >
          {/* Left column: search & context */}
          <section
            className="space-y-4"
            style={{ width: "100%", maxWidth: "32rem" }}
          >
            <div
              className="rounded-[1.5rem] p-4 md:p-6 space-y-5"
              style={{
                background:
                  "radial-gradient(circle_at_top,_rgba(34,197,94,0.1),transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),transparent_60%),rgba(0,0,0,0.9)",
                boxShadow: "0 22px 64px rgba(0,0,0,0.95)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "none",
              }}
            >
              <div className="space-y-2 mb-7"
                   style={{ marginBottom: "1.9rem" }}
              >
                <label className="block text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#cbd5f5", letterSpacing: "0.16em", marginBottom: "0.45rem" }}>
                  My wallet (owner)
                </label>
                <input
                  value={myWallet}
                  onChange={(e) => setMyWallet(e.target.value)}
                  className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm md:text-base placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  style={{ border: "none" }}
                  placeholder="0x1234... (address you control)"
                />
              </div>

              <div className="space-y-3 pt-5 pb-4 border-t border-slate-800/70 mb-6"
                   style={{ paddingTop: "1.4rem", paddingBottom: "1.1rem", marginBottom: "1.9rem" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#cbd5f5", letterSpacing: "0.16em", marginBottom: "0.45rem" }}>
                    Provider / exchange
                  </label>
                  <button
                    type="button"
                    aria-pressed={!showProviderFeatures}
                    onClick={() => {
                      const val = !showProviderFeatures;
                      if (!val) {
                        setProvider(null);
                      }
                      setShowProviderFeatures(val);
                      try { localStorage.setItem('showProviderFeatures', String(val)); } catch { /* ignore */ }
                    }}
                    className="text-[11px] sm:text-xs font-medium text-slate-400 hover:text-emerald-300"
                  >
                    {showProviderFeatures ? 'Hide selector' : 'Show selector'}
                  </button>
                </div>
                {showProviderFeatures && (
                  <div className="space-y-3" style={{ marginTop: "0.4rem" }}>
                    <div className="space-y-2" style={{ marginBottom: "0.6rem" }}>
                      <ProviderSelect
                        value={provider}
                        onChange={(p) => {
                          // If the selector asks to add a new provider (no _id), open the modal
                          if (p && !('_id' in p) && p.name) {
                            setPendingProviderName(p.name);
                            setAddingProvider(true);
                          } else {
                            setProvider(p as ProviderType | null);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddingProvider(true)}
                      className="inline-flex items-center rounded-full px-3.5 py-2 text-xs sm:text-sm font-medium"
                      style={{
                        border: "none",
                        backgroundColor: "rgba(34,197,94,0.12)",
                        color: "#bbf7d0",
                        boxShadow: "0 0 0 1px rgba(34,197,94,0.55)",
                      }}
                      aria-haspopup="dialog"
                    >
                      + Add provider to directory
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-800/70 mb-4"
                   style={{ paddingTop: "1.7rem", marginTop: "0.1rem", marginBottom: "1.6rem" }}
              >
                <div className="space-y-3">
                  <label className="block text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#cbd5f5", letterSpacing: "0.16em", marginBottom: "0.45rem" }}>
                    Chain
                  </label>
                  <select
                    value={chain}
                    onChange={(e) => setChain(e.target.value)}
                    className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    style={{ border: "none" }}
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="bsc">BSC</option>
                    <option value="polygon">Polygon</option>
                    <option value="bitcoin">Bitcoin</option>
                    <option value="solana">Solana</option>
                    <option value="tron">Tron</option>
                    <option value="xrp">XRP</option>
                  </select>
                </div>
                <div className="space-y-3" style={{ marginTop: "0.6rem" }}>
                  <label className="block text-[11px] sm:text-xs font-medium uppercase tracking-[0.16em]" style={{ color: "#cbd5f5", letterSpacing: "0.16em", marginBottom: "0.55rem" }}>
                    Receiving address
                  </label>
                  <input
                    value={suspect}
                    onChange={(e) => setSuspect(e.target.value)}
                    className="w-full rounded-full bg-black/40 px-4 py-2.5 text-sm md:text-base placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    style={{ border: "none" }}
                    placeholder="Address you want to check or flag"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStatusMessage(null);
                    if (!authenticated) {
                      openAuthModal({
                        title: 'Sign in required',
                        message: 'Reporting and flagging require wallet verification.',
                        redirectTo: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
                      });
                      return;
                    }
                    setOpenReportModal((v) => !v);
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm md:text-base font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
                >
                  Flag / Report address
                </button>
                <button
                  type="button"
                  onClick={signAndVerify}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm md:text-base font-semibold"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #22c55e, #22c55e)",
                    color: "#020617",
                    boxShadow: "0 10px 30px rgba(16,185,129,0.55)",
                    border: "none",
                  }}
                >
                  Sign & verify my wallet
                </button>
              </div>

              {statusMessage && <div className="mt-3 text-xs font-medium text-emerald-400">{statusMessage}</div>}
              {errorMessage && <div className="mt-2 text-xs font-medium text-red-400">{errorMessage}</div>}

              {/* Inline expanding panels */}
              <div className="mt-4 space-y-3">
                {/* Report panel */}
                <div
                  className={`overflow-hidden rounded-xl bg-slate-950/60 transition-all duration-300 ease-out ${
                    openReportModal ? 'max-h-[480px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
                  }`}
                  aria-hidden={!openReportModal}
                >
                  {openReportModal && (
                    <div className="p-4 md:p-5">
                      <ReportModal
                        inline
                        chain={chain}
                        myWallet={myWallet}
                        provider={provider ?? undefined}
                        suspect={suspect}
                        onClose={() => setOpenReportModal(false)}
                        onSubmitted={(report) => {
                          setSuspect('');
                          setOpenReportModal(false);
                          try {
                            const rep = (report as Record<string, unknown> | null) || null;
                            const rc = (rep && typeof rep.chain === 'string' ? rep.chain : chain) || 'ethereum';
                            const address = (rep && typeof rep.suspectAddress === 'string' ? rep.suspectAddress : suspect);
                            if (address) router.push(`/wallet/${rc}/${address}`);
                          } catch {
                            // ignore navigation errors
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Add provider inline panel */}
                <div
                  className={`overflow-hidden rounded-xl bg-slate-950/60 transition-all duration-300 ease-out ${
                    addingProvider ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
                  }`}
                  aria-hidden={!addingProvider}
                >
                  {addingProvider && (
                    <div className="p-4 md:p-5">
                      <AddProviderModal
                        inline
                        initialName={pendingProviderName || provider?.name || ''}
                        onClose={() => { setAddingProvider(false); setPendingProviderName(null); }}
                        onCreated={(p) => {
                          setProvider(p as ProviderType);
                          setAddingProvider(false);
                          setPendingProviderName(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Right column: helper card */}
          <aside className="space-y-4 mt-8 lg:mt-0">
            <div
              className="rounded-2xl p-3 md:p-4 shadow-lg shadow-black/40"
              style={{
                backgroundImage:
                  'radial-gradient(circle_at_top,_rgba(34,197,94,0.32),transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.32),transparent_60%),rgba(3,7,18,0.96)',
                border: '1px solid rgba(34,197,94,0.45)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative rounded-xl overflow-hidden flex-shrink-0"
                  style={{ width: '3.2rem', height: '3.2rem', background: 'radial-gradient(circle_at_top,_rgba(34,197,94,0.5),rgba(3,7,18,1))' }}
                >
                  {nftAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nftAvatarUrl}
                      alt="My NFT avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">
                      📸
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: '#facc15' }}>
                    My NFT photo
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#fefce8' }}>
                    Your linked NFT from Profile is used as your identity photo across wallet and search.
                  </p>
                  {!nftAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => router.push('/profile')}
                      className="mt-1.5 inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
                    >
                      Link NFT in Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-4 md:p-5 shadow-lg shadow-black/40 sticky top-[4.5rem]"
              style={{
                background:
                  "radial-gradient(circle_at_top,_rgba(34,197,94,0.1),transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),transparent_60%),rgba(0,0,0,0.9)",
                border: "none",
              }}
            >
              <h2 className="text-sm font-semibold mb-2" style={{ color: "#e5e7eb" }}>
                How this works
              </h2>
              <p className="text-xs mb-3" style={{ color: "var(--muted-text)" }}>
                Blockpage411 lets you attach context to wallet addresses: which exchange or provider they belong to, and whether you believe they
                are safe or risky.
              </p>
              <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: "var(--muted-text)" }}>
                <li>Connect / enter your own wallet address.</li>
                <li>Optionally link a known provider or add a new one.</li>
                <li>Paste the receiving address you want to check or report.</li>
                <li>Submit a report and we’ll route it into the reputation system.</li>
              </ol>
            </div>
          </aside>
        </div>
      </main>
      {/* full-screen modal variants removed in favor of inline expanding panels above */}
    </div>
  );
}
