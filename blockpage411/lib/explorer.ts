export function explorerUrlFor(address: string, chain?: string) {
  if (!address) return null;
  const a = String(address).trim();
  const lc = (chain || '').toLowerCase();

  // explicit chain mapping
  if (lc === 'ethereum' || lc === 'eth') return `https://etherscan.io/address/${a}`;
  if (lc === 'polygon' || lc === 'matic') return `https://polygonscan.com/address/${a}`;
  if (lc === 'bsc' || lc === 'binance') return `https://bscscan.com/address/${a}`;
  if (lc === 'solana' || lc === 'sol') return `https://solscan.io/account/${a}`;
  if (lc === 'tron' || lc === 'trx') return `https://tronscan.org/#/address/${a}`;
  if (lc === 'bitcoin' || lc === 'btc') return `https://blockstream.info/address/${a}`;

  // auto-detect by address shape
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return `https://etherscan.io/address/${a}`;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a)) return `https://blockstream.info/address/${a}`;
  if (/^[A-Za-z2-9]{32,44}$/.test(a)) return `https://solscan.io/account/${a}`;

  // fallback to a generic search
  return `/search?q=${encodeURIComponent(a)}`;
}
