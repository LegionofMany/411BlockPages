"use client";

import React from "react";
import Modal from "react-modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { OpenAuthModalDetail } from "./openAuthModal";

function buildCurrentPath(pathname: string, searchParams: URLSearchParams | null) {
  const qs = searchParams?.toString() || "";
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function AuthModalHost() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<OpenAuthModalDetail>({});
  const openRef = React.useRef(false);
  const lastOpenAtRef = React.useRef(0);
  const lastKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    try {
      // Improve accessibility for screen readers.
      Modal.setAppElement("#content");
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<OpenAuthModalDetail>;
      const d = ce?.detail || {};

      // Guard against rapid re-opens (common when multiple 401 handlers fire
      // or when React dev mode double-invokes effects).
      const key = `${d.title || ''}|${d.redirectTo || ''}|${d.ctaLabel || ''}`;
      const now = Date.now();
      if (openRef.current && key === lastKeyRef.current && now - lastOpenAtRef.current < 1000) {
        return;
      }
      lastKeyRef.current = key;
      lastOpenAtRef.current = now;

      setDetail(d);
      setOpen(true);
    }
    window.addEventListener("open-auth-modal", onOpen as EventListener);
    return () => window.removeEventListener("open-auth-modal", onOpen as EventListener);
  }, []);

  const title = detail.title || "Sign in required";
  const message =
    detail.message ||
    "To continue, please verify your wallet. This helps prevent abuse and enables KYC/verification when required.";
  const ctaLabel = detail.ctaLabel || "Verify / Sign in";

  return (
    <Modal
      isOpen={open}
      onRequestClose={() => setOpen(false)}
      contentLabel={title}
      overlayClassName="fixed inset-0 bg-black/60 z-[5000] flex items-end sm:items-center justify-center"
      className="relative w-full max-w-md mx-3 mb-0 sm:mb-6 rounded-t-2xl sm:rounded-2xl bg-slate-950 border border-slate-700 p-5 outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <p className="text-sm text-slate-300 mt-2">{message}</p>
        </div>
        <button
          type="button"
          className="text-slate-300 hover:text-white"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        <button
          type="button"
          className="px-3 py-2 rounded-md bg-white/5 text-slate-100 hover:bg-white/10"
          onClick={() => setOpen(false)}
        >
          Not now
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
          onClick={() => {
            const fallbackRedirectTo = buildCurrentPath(pathname, searchParams as unknown as URLSearchParams | null);
            const redirectTo = detail.redirectTo || fallbackRedirectTo;
            setOpen(false);
            try {
              router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
            } catch {
              // ignore
            }
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </Modal>
  );
}
