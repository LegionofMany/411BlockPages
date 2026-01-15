"use client";

export type OpenAuthModalDetail = {
  redirectTo?: string;
  title?: string;
  message?: string;
  ctaLabel?: string;
};

export function openAuthModal(detail: OpenAuthModalDetail = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent<OpenAuthModalDetail>("open-auth-modal", { detail }));
  } catch {
    // ignore
  }
}
