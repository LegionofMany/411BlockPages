'use client';
// app/hooks/useProfile.ts
import { useEffect, useState } from "react";

export default function useProfile() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.status === 401) {
          // Not authenticated — return null profile without spamming console
          setProfile(null);
          return;
        }
        if (!res.ok) {
          console.warn('useProfile: /api/me returned', res.status);
          setProfile(null);
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return { profile, loading, error };
}