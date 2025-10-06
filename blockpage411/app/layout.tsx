import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";

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
          color: '#f8fafc',
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
