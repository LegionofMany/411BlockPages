"use client";
export async function adminFetch(input: RequestInfo, init: RequestInit = {}) {
  const wallet = typeof window !== 'undefined' ? (localStorage.getItem('wallet') || '') : '';
  const headers = new Headers(init.headers || {});
  if (wallet) headers.set('x-admin-address', wallet);
  const res = await fetch(input, { ...init, headers });
  return res;
}

export default adminFetch;
