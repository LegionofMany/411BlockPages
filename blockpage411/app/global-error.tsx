"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#020617", color: "#e5e7eb", fontFamily: "system-ui" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 720, width: "100%", background: "rgba(2,6,23,0.85)", border: "1px solid rgba(51,65,85,0.6)", borderRadius: 16, padding: 20 }}>
            <h1 style={{ margin: 0, fontSize: 20 }}>Application error</h1>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: "#cbd5e1" }}>
              The app crashed while rendering. Refresh, or try again.
            </p>
            <pre style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,0.35)", borderRadius: 12, overflow: "auto", fontSize: 12 }}>
{String(error?.message || error)}
            </pre>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => reset()}
                style={{ border: 0, cursor: "pointer", background: "#10b981", color: "#020617", padding: "10px 14px", borderRadius: 999, fontWeight: 700 }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(51,65,85,0.8)", background: "rgba(15,23,42,0.6)", color: "#e2e8f0", padding: "10px 14px", borderRadius: 999, fontWeight: 700 }}
              >
                Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
