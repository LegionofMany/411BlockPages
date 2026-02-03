"use client";

import React, { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console so devs can see the root cause.
    // (In production you could forward this to Sentry.)
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#020617" }}>
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl">
        <h1 className="text-xl font-semibold text-slate-100">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-300">
          A page error occurred. Try again, or go back home.
        </p>

        <div className="mt-4 rounded-xl border border-slate-800 bg-black/40 p-3">
          <div className="text-[11px] font-mono text-slate-300 break-words">
            {error?.message || "Unknown error"}
          </div>
          {error?.digest ? (
            <div className="mt-2 text-[11px] text-slate-500">Digest: {error.digest}</div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
