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
import { openAuthModal } from "../../../components/auth/openAuthModal";
import { setDeferredAction } from "../../../components/auth/deferredAction";
import { ReputationGauge } from '../../../components/ui/ReputationGauge';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const payload = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    const err: any = new Error(payload?.message || 'Failed to load wallet data');
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
};

export default function WalletProfileClient({ initialData, chain, address }: { initialData: any; chain: string; address: string }) {
  const { data, error, mutate } = useSWR(`/api/wallet/${chain}/${address}`, fetcher, { fallbackData: initialData });
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
      const currentAddress = (address || '').toLowerCase();
      const isAdminWallet = envAdmins.includes(currentAddress);
      setIsAdmin(isAdminWallet);
    }
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    async function loadAuth() {
      try {
        const statusRes = await fetch('/api/auth/status', { credentials: 'include', cache: 'no-store' });
        const status = await statusRes.json().catch(() => ({} as any));
        if (cancelled) return;
        setIsAuthenticated(Boolean(status?.authenticated));
      } catch {
        if (cancelled) return;
        setIsAuthenticated(false);
      }
    }
    function onAuthChanged() {
      loadAuth();
    }
    loadAuth();
    window.addEventListener('auth-changed', onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  if (error) return <div className="text-center py-10 text-red-400">Failed to load wallet data.</div>;
  if (!data) return <div className="text-center py-10 text-cyan-200">Loading...</div>;

  const hasActiveDonation = data?.donationRequests?.some((d: DonationRequest) => d.active);
  const avatarUrl: string | undefined = data?.nftAvatarUrl || data?.avatarUrl;
  // Support both legacy and new API shapes (`riskScore` vs `risk_score`).
  const riskScore: number | null = typeof data?.risk_score === 'number' ? data.risk_score : (typeof data?.riskScore === 'number' ? data.riskScore : null);
  const rawRisk: any = data?.risk_level ?? data?.riskCategory ?? null;
  let riskCategory: 'green' | 'yellow' | 'red' | null = null;
  if (rawRisk === 'low' || rawRisk === 'green') riskCategory = 'green';
  else if (rawRisk === 'medium' || rawRisk === 'yellow') riskCategory = 'yellow';
  else if (rawRisk === 'high' || rawRisk === 'red') riskCategory = 'red';
  const reputationScore =
    typeof data?.reputation?.score === 'number'
      ? Math.max(0, Math.min(100, data.reputation.score))
      : typeof riskScore === 'number'
        ? Math.max(0, Math.min(100, 100 - Math.round(riskScore)))
        : null;

  const reputationLabel: string | null =
    typeof data?.reputation?.label === 'string'
      ? data.reputation.label
      : reputationScore == null
        ? null
        : reputationScore >= 80
          ? 'Strong'
          : reputationScore >= 60
            ? 'Good'
            : reputationScore >= 40
              ? 'Mixed'
              : reputationScore >= 20
                ? 'Caution'
                : 'High risk signals';

  const exchangeInteractions: Array<{ name: string; type: string; count: number }> = Array.isArray((data as any)?.exchangeInteractions)
    ? (data as any).exchangeInteractions
    : [];

  const connectedWallets = Array.isArray(data?.connectedWallets) ? data.connectedWallets : [];
  const heuristics = Array.isArray(data?.heuristicIndicators) ? data.heuristicIndicators : [];
  const graph = data?.followTheMoneyGraph || null;

  function riskPillClass(category?: string) {
    if (category === 'red') return 'bg-red-500/20 text-red-100 border-red-400/40';
    if (category === 'yellow') return 'bg-amber-500/20 text-amber-100 border-amber-400/40';
    return 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40';
  }

  const visibilityLabel = (() => {
    const vis = data?.visibility as
      | { canSeeBalance?: boolean; isOwner?: boolean; heavilyFlagged?: boolean; isPublic?: boolean; unlockLevel?: number }
      | undefined;
    if (!vis) return null;
    if (vis.isOwner) return 'Owner view (you are viewing your own wallet)';
    if (vis.canSeeBalance) return 'Public view (balances visible to anyone)';
    return 'Limited view (balances hidden for most viewers)';
  })();

  const sentTxs: any[] = Array.isArray(data?.transactions)
    ? data.transactions.filter((t: any) => String(t?.from || '').toLowerCase() === String(address || '').toLowerCase())
    : [];

  const isOwner = Boolean((data as any)?.visibility?.isOwner);

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="flex-1 w-full max-w-3xl px-4 py-8 mt-16" style={{ width: '100%', maxWidth: '920px' }}>
        <div className="rounded-xl shadow-md p-6" style={{ background: 'linear-gradient(180deg, #061026 0%, #071630 100%)', border: '1px solid rgba(99,102,241,0.06)', boxShadow: '0 6px 18px rgba(2,6,23,0.6)' }}>
          <V5UpgradeInfo />
          <div className="mb-4">
            <UserProfile walletAddress={address} chain={chain} />
            <div className="text-sm text-slate-400 mt-2">Chain: {chain}</div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Balance</div>
              {data?.balance ? (
                <div className="mt-2">
                  <div className="text-xl font-semibold text-slate-100">
                    {Number(data.balance.amountNative || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} {data.balance.symbol || 'NATIVE'}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">
                    {typeof data.balance.amountUsd === 'number'
                      ? `$${data.balance.amountUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : 'USD value unavailable'}
                  </div>
                  {typeof data.balance.priceUsd === 'number' ? (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Price ~ ${data.balance.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}/{data.balance.symbol || 'token'}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">Balance unavailable for this chain.</div>
              )}
            </section>

            <section className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Reputation</div>
              <div className="mt-2">
                <ReputationGauge score={reputationScore} />
                {reputationLabel ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-100">
                    {reputationLabel}
                  </div>
                ) : null}
                <div className="mt-2 text-[11px] text-slate-400">
                  Informational signal based on on-chain patterns and community reports.
                </div>
              </div>
            </section>
          </div>

          {exchangeInteractions.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Exchange interactions</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {exchangeInteractions.slice(0, 8).map((x) => (
                  <span
                    key={`${x.type}:${x.name}`}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-100"
                    title={`${x.count} transactions (best-effort)`}
                  >
                    {x.name} · {x.count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {isOwner && sentTxs.length > 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-100">Your sent transactions</div>
                <div className="text-[11px] text-slate-400">Rate & annotate past transactions</div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {sentTxs.slice(0, 20).map((t: any) => {
                  const hash = String(t?.hash || t?.txid || '');
                  const to = String(t?.to || '');
                  if (!hash) return null;
                  return (
                    <button
                      key={hash}
                      type="button"
                      className="w-full text-left rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2 hover:bg-slate-950/50"
                      onClick={() => {
                        try {
                          router.push(`/tx/${encodeURIComponent(chain)}/${encodeURIComponent(hash)}`);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-xs text-slate-100 truncate">{hash.slice(0, 10)}…{hash.slice(-8)}</div>
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-100">
                          Rate
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400 truncate">To: {to ? `${to.slice(0, 10)}…${to.slice(-6)}` : '—'}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Ratings are restricted: you can only rate transactions sent from your connected wallet.
              </div>
            </div>
          ) : null}

          {(connectedWallets.length > 0 || heuristics.length > 0 || graph) && (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {connectedWallets.length > 0 && (
                <section className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-100">Connected wallets</div>
                    <div className="text-[11px] text-slate-400">Top counterparties (best-effort)</div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {connectedWallets.slice(0, 10).map((w: any) => (
                      <button
                        key={w.address}
                        type="button"
                        className="w-full text-left rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2 hover:bg-slate-950/50"
                        onClick={() => {
                          try {
                            router.push(`/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(w.address)}`);
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono text-xs text-slate-100 truncate">{String(w.address || '').slice(0, 10)}…{String(w.address || '').slice(-6)}</div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskPillClass(w?.risk?.category)}`}>
                            {w?.risk?.category || 'green'}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {w.txCount} tx · {w.direction} · {Number(w.totalValueNative || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {graph?.nodes && graph?.edges && (
                <section className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="text-sm font-semibold text-slate-100">Follow-the-money graph</div>
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/5 bg-slate-950/30 p-3">
                    {/* Minimal graph: center node + orbit nodes for readability and zero deps */}
                    <svg viewBox="0 0 320 180" className="w-full h-[180px]">
                      {(() => {
                        const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
                        const edges = Array.isArray(graph.edges) ? graph.edges : [];
                        const center = { x: 160, y: 90 };
                        const others = nodes.filter((n: any) => n?.kind !== 'target').slice(0, 10);
                        const placed: Array<{ id: any; x: number; y: number }> = others.map((n: any, i: number) => {
                          const angle = (i / Math.max(1, others.length)) * Math.PI * 2;
                          return { id: n.id, x: center.x + Math.cos(angle) * 70, y: center.y + Math.sin(angle) * 55 };
                        });
                        const pos = new Map<string, { x: number; y: number }>();
                        pos.set(String(nodes.find((n: any) => n?.kind === 'target')?.id || ''), center);
                        placed.forEach((p) => pos.set(String(p.id), { x: p.x, y: p.y }));
                        return (
                          <>
                            {edges.slice(0, 14).map((e: any, idx: number) => {
                              const a = pos.get(String(e.source));
                              const b = pos.get(String(e.target));
                              if (!a || !b) return null;
                              return <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(148,163,184,0.35)" strokeWidth={1} />;
                            })}
                            <circle cx={center.x} cy={center.y} r={12} fill="rgba(16,185,129,0.95)" />
                            {placed.map((p) => (
                              <circle key={p.id} cx={p.x} cy={p.y} r={8} fill="rgba(56,189,248,0.85)" />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                    <div className="text-[11px] text-slate-400">Graph is an approximation of top counterparties.</div>
                  </div>
                </section>
              )}

              {heuristics.length > 0 && (
                <section className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="text-sm font-semibold text-slate-100">Pattern indicators</div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {heuristics.slice(0, 6).map((h: any) => {
                      const level = String(h.level || 'low');
                      const badge = level === 'high' ? 'bg-red-500/20 text-red-100 border-red-400/40'
                        : level === 'medium' ? 'bg-amber-500/20 text-amber-100 border-amber-400/40'
                        : 'bg-slate-500/20 text-slate-100 border-slate-400/30';
                      return (
                        <div key={h.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-100">{h.title}</div>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge}`}>{level}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-300">{h.summary}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              disabled={followLoading}
              onClick={async () => {
                setFollowLoading(true);
                try {
                  if (!isAuthenticated) {
                    setDeferredAction({ type: 'followWallet', chain, address });
                    openAuthModal({
                      title: 'Sign in required',
                      message: 'Following wallets is only available after wallet verification.',
                      redirectTo: `/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
                    });
                    return;
                  }

                  const resp = await fetch('/api/follow-wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ chain, address }),
                  });
                  if (resp.status === 401) {
                    setDeferredAction({ type: 'followWallet', chain, address });
                    openAuthModal({
                      title: 'Sign in required',
                      message: 'Following wallets is only available after wallet verification.',
                      redirectTo: `/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
                    });
                    return;
                  }
                  if (!resp.ok) {
                    const j = await resp.json().catch(() => ({} as any));
                    throw new Error(j?.message || resp.statusText || 'Follow failed');
                  }
                  setFollowed(true);
                } catch {
                  // swallow; user can retry
                } finally {
                  setFollowLoading(false);
                }
              }}
            >
              {followed ? 'Following' : followLoading ? 'Following…' : 'Follow'}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => {
                try {
                  router.push('/follow-wallet');
                } catch {
                  // ignore
                }
              }}
            >
              My follows
            </button>
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
                  if (res.status === 401) {
                    try {
                      setDeferredAction({
                        type: 'flagWallet',
                        chain,
                        address,
                        reason,
                        comment,
                      });
                    } catch {
                      // ignore
                    }
                    openAuthModal({
                      title: "Sign in required",
                      message: "Flagging requires a verified wallet session.",
                      redirectTo: `/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
                    });
                  }
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
              {data?.txRatingsSummary ? (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                    Tx ratings (sent): {Number(data.txRatingsSummary.avgScore || 0).toFixed(2)} / 5
                  </span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200/90">
                    {Number(data.txRatingsSummary.count || 0)} rated txs
                  </span>
                </div>
              ) : null}
              <WalletRatingSection
                address={address}
                chain={chain}
                ratings={data?.ratings || []}
                userRating={Number(data?.userRating || 0)}
                verificationScore={data?.verificationScore}
                onRate={async (score, text) => {
                  const resp = await fetch("/api/ratings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address, chain, rating: score, text }),
                    credentials: 'include'
                  });
                  if (!resp.ok) {
                    if (resp.status === 401) {
                      try {
                        setDeferredAction({
                          type: 'rateWallet',
                          chain,
                          address,
                          rating: Number(score),
                          text,
                        });
                      } catch {
                        // ignore
                      }
                      openAuthModal({
                        title: "Sign in required",
                        message: "Rating requires a verified wallet session.",
                        redirectTo: `/wallet/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
                      });
                    }
                    let body: unknown = null;
                    try { body = await resp.json(); } catch {}
                    const obj = body as Record<string, unknown> | null;
                    const err = new Error(obj && typeof obj.message === 'string' ? obj.message : 'Rating failed');
                    (err as unknown as Record<string, unknown>).status = resp.status;
                    throw err;
                  }
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
        className="ml-4 px-3 py-1 rounded-md bg-white text-slate-900 font-semibold border border-slate-200 disabled:opacity-60"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch('/api/kyc-request', { method: 'POST', credentials: 'include' });
            if (res.status === 401) {
              openAuthModal({
                title: 'Sign in required',
                message: 'KYC/verification requires a verified wallet session.',
              });
              setLoading(false);
              return;
            }
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
