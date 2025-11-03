"use client";
export async function adminFetch(input: RequestInfo, init: RequestInit = {}) {
  const wallet = typeof window !== 'undefined' ? (localStorage.getItem('wallet') || '') : '';
  const headers = new Headers(init.headers || {});
  if (wallet) headers.set('x-admin-address', wallet);
  // Ensure cookies (JWT token) are sent so server can authenticate admin requests
  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  return res;
}

export default adminFetch;
