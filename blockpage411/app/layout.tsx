import type { Metadata } from "next";
import { Suspense } from 'react';
import "../styles/globals.css";
import { Providers } from "./components/Providers";
import Navbar from "./components/Navbar";
import { AuthGate } from "./components/AuthGate";

export const metadata: Metadata = {
  // Set the canonical site origin so Next.js can generate consistent absolute URLs
  metadataBase: new URL("https://www.blockpages411.com"),
  title: "Blockpage411",
  description: "Blockchain-powered 411 directory for wallets",
  // Declare the preferred canonical for the root path to help search engines
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="min-h-screen"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          backgroundColor: '#0a1020',
          background: 'radial-gradient(circle at top, #1a223a, #0a1020)',
          // reserve space for the fixed navbar
          paddingTop: '4rem'
        }}
      >
          <Providers>
            <Suspense fallback={null}>
              <AuthGate />
            </Suspense>
            {/* Ensure html[lang] is set for assistive tech and automated audits */}
            <script dangerouslySetInnerHTML={{ __html: "if(!document.documentElement.lang)document.documentElement.lang='en';" }} />
            {/* Accessible skip link: hidden until focused for keyboard users */}
            <a
              href="#content"
              className="sr-only fixed left-3 top-3 z-[4000] rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-50 shadow-lg shadow-slate-950/40 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Skip to content
            </a>
            {/* Navbar moved to layout so it's outside page stacking contexts and visible on all routes */}
            <Navbar />
            {/* main content anchor used by the skip link and to mark content inert while mobile drawer is open */}
            <div id="content">{children}</div>
          </Providers>
      </body>
    </html>
  );
}
