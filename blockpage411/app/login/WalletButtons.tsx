"use client";

import React, { useMemo, useState } from "react";
import { useEvmWallet } from "../../components/EvmWalletProvider";

type Props = {
  onError?: (e: unknown) => void;
};

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function hasInjectedEthereum() {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum;
}

function hasMetaMaskInjected() {
  if (typeof window === "undefined") return false;
  const eth = (window as any).ethereum;
  if (!eth) return false;
  if (eth.isMetaMask) return true;
  const providers = Array.isArray(eth.providers) ? eth.providers : [];
  return providers.some((p: any) => p?.isMetaMask);
}

function hasCoinbaseInjected() {
  if (typeof window === "undefined") return false;
  const eth = (window as any).ethereum;
  if (!eth) return false;
  if (eth.isCoinbaseWallet) return true;
  const providers = Array.isArray(eth.providers) ? eth.providers : [];
  return providers.some((p: any) => p?.isCoinbaseWallet);
}

function hasTrustWalletInjected() {
  if (typeof window === "undefined") return false;
  const eth = (window as any).ethereum;
  if (!eth) return false;
  if (eth.isTrust || eth.isTrustWallet) return true;
  const providers = Array.isArray(eth.providers) ? eth.providers : [];
  return providers.some((p: any) => p?.isTrust || p?.isTrustWallet);
}

function buildMetaMaskDeepLink(currentUrl: string) {
  // MetaMask expects: https://metamask.app.link/dapp/<dapp-url-without-protocol>
  // Example: https://metamask.app.link/dapp/example.com/login
  const withoutProtocol = currentUrl.replace(/^https?:\/\//i, "");
  return `https://metamask.app.link/dapp/${withoutProtocol}`;
}

function buildCoinbaseDeepLink(currentUrl: string) {
  // Coinbase Wallet deep link format.
  // Ref: https://go.cb-w.com/dapp?cb_url=<encoded_url>
  return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`;
}

function buildTrustWalletDeepLink(currentUrl: string) {
  // Trust Wallet universal deep link.
  // coin_id=60 is Ethereum; still works for opening the dapp browser.
  return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`;
}

export default function WalletButtons({ onError }: Props) {
  const { connectMetaMask, connectCoinbase, connectTrustWallet, connectUniswapWallet, isConnecting } = useEvmWallet();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showWalletBrowser, setShowWalletBrowser] = useState(false);
  const hasWalletConnect = !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  const isBusy = useMemo(() => isConnecting || !!loadingId, [isConnecting, loadingId]);

  async function handleConnectMetaMask() {
    try {
      setLoadingId("metamask");

      const isMobile = isMobileDevice();
      const hasInjected = hasInjectedEthereum();
      const isMetaMask = hasMetaMaskInjected();

      // Mobile + no injected provider: deep link into MetaMask app.
      if (isMobile && (!hasInjected || !isMetaMask)) {
        try {
          window.localStorage.setItem("walletLoginPending", "true");
        } catch {
          // ignore
        }
        const deepLink = buildMetaMaskDeepLink(window.location.href);
        window.location.href = deepLink;
        return;
      }

      await connectMetaMask();
    } catch (e) {
      onError?.(e);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleConnectCoinbase() {
    try {
      setLoadingId("coinbaseWallet");

      const isMobile = isMobileDevice();
      const hasInjected = hasInjectedEthereum();
      const isCoinbase = hasCoinbaseInjected();

      // Mobile + no injected Coinbase provider: deep link into Coinbase Wallet.
      // This provides a smoother UX than trying to connect from a regular mobile browser.
      if (isMobile && (!hasInjected || !isCoinbase)) {
        try {
          window.localStorage.setItem("walletLoginPending", "true");
        } catch {
          // ignore
        }
        const deepLink = buildCoinbaseDeepLink(window.location.href);
        window.location.href = deepLink;
        return;
      }

      await connectCoinbase();
    } catch (e) {
      onError?.(e);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleConnectTrustWallet() {
    try {
      setLoadingId("trustWallet");

      const isMobile = isMobileDevice();
      const hasInjected = hasInjectedEthereum();
      const isTrust = hasTrustWalletInjected();

      // Mobile + no injected Trust provider: deep link into Trust Wallet.
      if (isMobile && (!hasInjected || !isTrust)) {
        try {
          window.localStorage.setItem("walletLoginPending", "true");
        } catch {
          // ignore
        }
        const deepLink = buildTrustWalletDeepLink(window.location.href);
        window.location.href = deepLink;
        return;
      }

      await connectTrustWallet();
    } catch (e) {
      onError?.(e);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleConnectUniswapWallet() {
    try {
      setLoadingId('uniswap');
      await connectUniswapWallet();
    } catch (e) {
      onError?.(e);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-500"
        onClick={handleConnectMetaMask}
        disabled={isBusy}
      >
        <span className="text-2xl">🦊</span>
        <span className="font-bold">MetaMask</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500"
        onClick={handleConnectCoinbase}
        disabled={isBusy}
      >
        <span className="text-2xl">💼</span>
        <span className="font-bold">Coinbase Wallet</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500"
        onClick={handleConnectTrustWallet}
        disabled={isBusy}
      >
        <span className="text-2xl">🛡️</span>
        <span className="font-bold">Trust Wallet</span>
      </button>

      <button
        className="w-full btn-primary flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-fuchsia-600"
        onClick={handleConnectUniswapWallet}
        disabled={isBusy || !hasWalletConnect}
        title={!hasWalletConnect ? 'WalletConnect is not configured (set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).' : undefined}
      >
        <span className="text-2xl">🦄</span>
        <span className="font-bold">Uniswap Wallet</span>
        {!hasWalletConnect && <span className="ml-2 text-[11px] font-semibold text-slate-200/90">(setup needed)</span>}
      </button>

      {/* Client request: explicit 'Open in wallet browser' entry point for mobile */}
      {isMobileDevice() && (
        <button
          type="button"
          className="w-full btn-primary flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600"
          onClick={() => setShowWalletBrowser(true)}
          disabled={isBusy}
        >
          <span className="font-semibold">Open in wallet app (recommended)</span>
        </button>
      )}

      {isMobileDevice() && (
        <div className="text-xs text-slate-400 text-center">
          On mobile, your wallet may open in a separate app. After approving, return here to continue.
        </div>
      )}

      {showWalletBrowser && typeof window !== 'undefined' && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowWalletBrowser(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-slate-950 border border-slate-700 p-4 mx-3 mb-0 sm:mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-100 font-semibold">Open in a wallet app</div>
              <button
                type="button"
                className="text-slate-300 hover:text-white"
                onClick={() => setShowWalletBrowser(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 mb-3">
              This opens the current page inside your wallet’s built-in browser (best reliability on mobile).
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100"
                onClick={() => {
                  try {
                    window.localStorage.setItem("walletLoginPending", "true");
                  } catch {
                    // ignore
                  }
                  window.location.href = buildMetaMaskDeepLink(window.location.href);
                }}
              >
                MetaMask
              </button>
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100"
                onClick={() => {
                  try {
                    window.localStorage.setItem("walletLoginPending", "true");
                  } catch {
                    // ignore
                  }
                  window.location.href = buildCoinbaseDeepLink(window.location.href);
                }}
              >
                Coinbase Wallet
              </button>
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100"
                onClick={() => {
                  try {
                    window.localStorage.setItem("walletLoginPending", "true");
                  } catch {
                    // ignore
                  }
                  window.location.href = buildTrustWalletDeepLink(window.location.href);
                }}
              >
                Trust Wallet
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Tip: If nothing happens, make sure the wallet app is installed and unlocked, then try again.
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400">
        Mobile tip: In Safari/Chrome, use “Open in wallet app” for the smoothest connection.
      </div>
    </div>
  );
}
