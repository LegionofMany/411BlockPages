"use client";
export async function adminFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  // Ensure cookies (JWT token) are sent so server can authenticate admin requests
  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  return res;
}

export default adminFetch;
