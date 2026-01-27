import Link from 'next/link';
import { EVM_CHAINS, EVM_CHAIN_PRIORITY, normalizeEvmChainId } from '../../../../lib/evmChains';
import { fetchEvmTxByHash } from '../../../../lib/evmTxLookup';
import TxRatingPanel from './TxRatingPanel';
import dbConnect from '../../../../lib/db';
import ProviderWallet from '../../../../lib/providerWalletModel';
import Provider from '../../../../lib/providerModel';
import Wallet from '../../../../lib/walletModel';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { chain: string; hash: string };
};

export default async function TxPage(props: PageProps) {
  const { chain, hash } = props.params;
  const chainId = normalizeEvmChainId(chain);

  if (!chainId) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-50">Transaction</h1>
        <p className="mt-2 text-slate-200/80">Unsupported chain: {chain}</p>
      </main>
    );
  }

  const cfg = EVM_CHAINS[chainId];
  const tx = await fetchEvmTxByHash(chainId, hash);

  if (!tx) {
    // If user landed on the wrong chain slug, probe other EVM chains and redirect.
    try {
      for (const c of EVM_CHAIN_PRIORITY) {
        if (c === chainId) continue;
        const found = await fetchEvmTxByHash(c, hash);
        if (found) {
          redirect(`/tx/${encodeURIComponent(c)}/${encodeURIComponent(hash)}`);
        }
      }
    } catch {
      // ignore
    }
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-50">Transaction</h1>
        <p className="mt-2 text-slate-200/80">No transaction found for this hash on {cfg.label}.</p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
            href={cfg.explorerTxBase + encodeURIComponent(hash)}
            target="_blank"
            rel="noreferrer"
          >
            Open in explorer
          </Link>
        </div>
      </main>
    );
  }

  const explorerUrl = cfg.explorerTxBase + encodeURIComponent(tx.hash);

  // Best-effort exchange/provider tagging for the parties in this tx.
  let fromTag: { name: string; type: string } | null = null;
  let toTag: { name: string; type: string } | null = null;
  try {
    await dbConnect();
    const addrs = [tx.from, tx.to].filter(Boolean).map((a) => String(a).toLowerCase());
    const pws = (await ProviderWallet.find({ chain: chainId, address: { $in: addrs } }).lean()) as any[];
    const providerIds = Array.from(new Set(pws.map((x) => String(x?.providerId || '')).filter(Boolean)));
    const providers = providerIds.length
      ? ((await Provider.find({ _id: { $in: providerIds } }).select('name type').lean()) as any[])
      : [];
    const providerById = new Map<string, { name: string; type: string }>();
    for (const p of providers) providerById.set(String(p?._id), { name: String(p?.name || ''), type: String(p?.type || 'Other') });

    const byAddr = new Map<string, { name: string; type: string }>();
    for (const pw of pws) {
      const prov = providerById.get(String(pw?.providerId || ''));
      if (prov?.name) byAddr.set(String(pw?.address || '').toLowerCase(), prov);
    }

    // Fallback: Wallet.exchangeSource
    if (addrs.length) {
      const tagged = (await Wallet.find({ chain: chainId, address: { $in: addrs } }).select('address exchangeSource').lean()) as any[];
      for (const w of tagged) {
        const a = String(w?.address || '').toLowerCase();
        const ex = typeof w?.exchangeSource === 'string' ? String(w.exchangeSource).trim() : '';
        if (!a || !ex) continue;
        if (!byAddr.has(a)) byAddr.set(a, { name: ex, type: 'Exchange' });
      }
    }

    fromTag = byAddr.get(String(tx.from || '').toLowerCase()) || null;
    toTag = tx.to ? byAddr.get(String(tx.to || '').toLowerCase()) || null : null;
  } catch {
    fromTag = null;
    toTag = null;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-50">Transaction</h1>
          <div className="mt-1 text-sm text-slate-200/80">{cfg.label}</div>
        </div>
        <Link
          className="shrink-0 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          Explorer
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
        <div className="px-4 py-3 border-b border-white/10">
          <div className="text-xs font-semibold text-slate-200/80">Hash</div>
          <div className="mt-1 break-all text-sm text-slate-50">{tx.hash}</div>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="px-4 py-3 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10">
            <div className="text-xs font-semibold text-slate-200/80">From</div>
            <div className="mt-1 break-all text-sm text-slate-50">{tx.from}</div>
                  {fromTag?.name ? (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-100">
                        {fromTag.type === 'CEX' || fromTag.type === 'Exchange' ? 'Exchange' : 'Provider'}: {fromTag.name}
                      </span>
                    </div>
                  ) : null}
            <div className="mt-2">
              <Link className="text-sm text-emerald-200 hover:text-emerald-100" href={`/wallet/${chainId}/${tx.from}`}>
                View sender wallet
              </Link>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-slate-200/80">To</div>
            <div className="mt-1 break-all text-sm text-slate-50">{tx.to || '—'}</div>
                  {toTag?.name ? (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-100">
                        {toTag.type === 'CEX' || toTag.type === 'Exchange' ? 'Exchange' : 'Provider'}: {toTag.name}
                      </span>
                    </div>
                  ) : null}
            {tx.to ? (
              <div className="mt-2">
                <Link className="text-sm text-emerald-200 hover:text-emerald-100" href={`/wallet/${chainId}/${tx.to}`}>
                  View recipient wallet
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 border-t border-white/10">
          <div className="px-4 py-3 sm:border-r sm:border-white/10">
            <div className="text-xs font-semibold text-slate-200/80">Value</div>
                  <div className="mt-1 text-sm text-slate-50">{tx.valueEther} {cfg.nativeSymbol}</div>
          </div>
          <div className="px-4 py-3 sm:border-r sm:border-white/10">
            <div className="text-xs font-semibold text-slate-200/80">Block</div>
            <div className="mt-1 text-sm text-slate-50">{tx.blockNumber ?? '—'}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-slate-200/80">Chain</div>
            <div className="mt-1 text-sm text-slate-50">{chainId}</div>
          </div>
        </div>
      </div>

      <TxRatingPanel chain={chainId} txHash={tx.hash} from={tx.from} />
    </main>
  );
}
