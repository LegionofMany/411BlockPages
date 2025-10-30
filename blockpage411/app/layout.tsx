import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blockpage411",
  description: "Blockchain-powered 411 directory for wallets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen ${geistSans.variable} ${geistMono.variable}`}
        style={{
          background: 'radial-gradient(circle at top, #1a223a, #0a1020)',
          // reserve space for the fixed navbar
          paddingTop: '4rem'
        }}
      >
          <Providers>
            {/* Accessible skip link and navbar placed in layout */}
            <a
              href="#content"
              className="text-sm rounded px-3 py-1"
              style={{
                position: 'fixed',
                left: 12,
                top: 12,
                zIndex: 2150000000,
                background: 'rgba(255,255,255,0.02)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
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
