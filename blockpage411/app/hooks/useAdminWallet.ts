'use client';

import { useEffect, useState } from 'react';
import { getAddress } from 'ethers';

// local minimal Ethereum provider shape for typings
type EthereumProvider = {
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  request?: (...args: unknown[]) => Promise<unknown>;
};

export default function useAdminWallet() {
  const [adminWallet, setAdminWallet] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function checkAdmin() {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('wallet') || '';
      let wallet = raw;
      try {
        wallet = getAddress(raw || '');
      } catch {
        wallet = (raw || '').toLowerCase().trim();
      }
      setAdminWallet(wallet || '');

      const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
        .split(',')
        .map((a) => {
          try {
            return getAddress(a);
          } catch {
            return a.toLowerCase().trim();
          }
        });

      if (
        wallet &&
        adminWallets
          .map((a) => (a || '').toLowerCase().trim())
          .includes((wallet || '').toLowerCase().trim())
      ) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setChecked(true);
    }

    checkAdmin();

    async function checkServerAdmin() {
      try {
        const res = await fetch('/api/admin/check');
        if (res.ok) {
          const body = await res.json();
          if (body && body.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          setChecked(true);
        }
      } catch {
        // ignore network errors; fall back to client-side check
      }
    }

    checkServerAdmin();

    function onStorage(e: StorageEvent) {
      if (!e.key || e.key === 'wallet') checkAdmin();
    }
    window.addEventListener('storage', onStorage);

    const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    function onAccountsChanged(...args: unknown[]) {
      const maybe = args[0];
      const accounts = Array.isArray(maybe) ? (maybe as string[]) : [];
      if (!accounts || accounts.length === 0) {
        localStorage.removeItem('wallet');
      } else {
        try {
          localStorage.setItem('wallet', getAddress(accounts[0]));
        } catch {
          localStorage.setItem('wallet', accounts[0].toLowerCase());
        }
      }
      checkAdmin();
    }

    if (eth && eth.on) {
      eth.on('accountsChanged', onAccountsChanged);
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      if (eth && eth.removeListener)
        eth.removeListener('accountsChanged', onAccountsChanged);
    };
  }, []);

  return { adminWallet, isAdmin, checked };
}
