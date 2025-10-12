import React, { useCallback, useState } from "react";
import Image from 'next/image';
import type { DonationRequest } from "../../../../lib/types";

interface DonationSectionProps {
  donationRequests?: DonationRequest[];
}

function isEthAddress(v: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(v);
}
function isBnbAddress(v: string) {
  // BNB uses same address format as Ethereum for EVM chains
  return isEthAddress(v);
}
function isBtcAddress(v: string) {
  return /^(bc1|1|3)[a-zA-Z0-9]{25,39}$/.test(v);
}
function isSolAddress(v: string) {
  // Rough Solana pubkey pattern (base58, 32-44 chars)
  return /^[A-Za-z0-9_-]{32,44}$/.test(v) && v.length >= 32 && v.length <= 44;
}

const small = (s?: string) => s ?? '';

const DonationSection: React.FC<DonationSectionProps> = ({ donationRequests }) => {
  if (!donationRequests || donationRequests.length === 0) return null;

  return (
    <div className="mt-6 w-full text-left">
      <h3 className="text-cyan-300 font-semibold mb-4">Support this wallet</h3>
      <div className="grid gap-4">
        {donationRequests.map((donation, idx) => {
          const id = ((donation as DonationRequest & { _id?: string })._id) ?? idx;
          const url = small(donation.url);
          const description = small(donation.description);
          // allow optional fields like goal/raised if present on the record
          const anyRec = donation as unknown as Record<string, unknown>;
          const goal = typeof anyRec['goal'] === 'number' ? (anyRec['goal'] as number) : undefined;
          const raised = typeof anyRec['raised'] === 'number' ? (anyRec['raised'] as number) : undefined;
          const recent = Array.isArray(anyRec['recentDonors']) ? (anyRec['recentDonors'] as Array<Record<string, unknown>>) : undefined;

          // detect if url is a plain wallet address
          const looksLikeAddress = !!url && !/^https?:\/\//i.test(url);
          const isEth = looksLikeAddress && isEthAddress(url);
          const isBnb = looksLikeAddress && isBnbAddress(url);
          const isBtc = looksLikeAddress && isBtcAddress(url);
          const isSol = looksLikeAddress && isSolAddress(url);

          return (
            <article key={id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h4 className="text-lg font-semibold text-white truncate">{donation.platform || 'Donation'}</h4>
                    <span className="text-xs text-slate-400">{donation.expiresAt ? `Expires ${new Date(donation.expiresAt).toLocaleDateString()}` : ''}</span>
                  </div>
                  {description && <p className="mt-2 text-slate-300 text-sm">{description}</p>}

                  {/* progress bar if we have numbers */}
                  {typeof goal === 'number' && typeof raised === 'number' ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                        <span>Raised: <strong className="text-white">{raised}</strong></span>
                        <span>Goal: <strong className="text-white">{goal}</strong></span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2" style={{ width: `${Math.min(100, (raised / goal) * 100)}%` }} />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="w-44 flex-shrink-0 text-right">
                  {/* quick donate button linking to URL if it's an http link, otherwise show address actions */}
                  {url ? (
                    /^https?:\/\//i.test(url) ? (
                      <a href={url} target="_blank" rel="noreferrer" className="inline-block px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm">Donate</a>
                    ) : (
                      <AddressActions address={url} isEth={isEth} isBnb={isBnb} isBtc={isBtc} isSol={isSol} />
                    )
                  ) : (
                    <span className="text-sm text-slate-500">No address/URL provided</span>
                  )}
                </div>
              </div>

              {/* recent donors */}
              {recent && recent.length > 0 ? (
                <div className="mt-3 text-sm text-slate-300">
                  <div className="font-medium mb-1">Recent donors</div>
                  <ul className="space-y-1 max-h-40 overflow-auto">
                    {recent.map((r, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-slate-300">{String(r['name'] ?? 'Anonymous')}</span>
                        <span className="text-slate-200">{String(r['amount'] ?? '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};

function AddressActions({ address, isEth, isBnb, isBtc, isSol }: { address: string; isEth: boolean; isBnb: boolean; isBtc: boolean; isSol: boolean }) {
  const [copied, setCopied] = useState(false);
  const chain = isBtc ? 'Bitcoin' : isSol ? 'Solana' : isEth || isBnb ? (isBnb ? 'BNB' : 'Ethereum') : 'Wallet';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(address)}`;
  const walletUri = isBtc ? `bitcoin:${address}` : isSol ? `solana:${address}` : (isEth || isBnb) ? `ethereum:${address}` : `web+wallet:${address}`;

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }, [address]);

  return (
    <div className="text-right">
      <div className="text-xs text-slate-400">{chain}</div>
      <div className="mt-2 border border-slate-800 bg-slate-950 rounded-md p-2 text-left">
        <div className="truncate text-sm text-slate-100 font-mono">{address}</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button onClick={onCopy} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded text-white">{copied ? 'Copied' : 'Copy'}</button>
          <a href={qrSrc} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded text-white">Open QR</a>
          <a href={walletUri} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-xs rounded text-white">Pay</a>
        </div>
        <div className="w-28 mt-2 mx-auto rounded overflow-hidden">
          <Image src={qrSrc} alt="QR code" width={220} height={220} />
        </div>
      </div>
    </div>
  );
}

export default DonationSection;
