export const dynamic = 'force-dynamic';

import Footer from "./components/Footer";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import ChainCarousel from "./components/landing/ChainCarousel";
import SampleWallet from "./components/landing/SampleWallet";
import PopularWallets from "./components/landing/PopularWallets";
import RealTimeTransactions from "./components/landing/RealTimeTransactions";
import Testimonials from "./components/landing/Testimonials";
import LiveStats from "./components/landing/LiveStatsClient";
import LandingSearchDemo from "./components/landing/LandingSearchDemo";
import SocialProof from "./components/landing/SocialProof";
import FAQ from "./components/landing/FAQ";
import ThemeProvider from "./components/ThemeProvider";

export default function Page() {
  return (
    <ThemeProvider>
      <div
        className="flex flex-col min-h-screen"
        style={{
          backgroundColor: "#020617",
          backgroundImage:
            "radial-gradient(circle_at_top,_rgba(15,23,42,0.9),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),transparent_55%)",
        }}
      >
        <main className="flex-1 flex flex-col items-center w-full pt-24">
          <Hero />
          <LandingSearchDemo />
          <LiveStats />
          <ChainCarousel />
          <Features />
          <PopularWallets />
          <SampleWallet />
          <Testimonials />
          <SocialProof />
          <FAQ />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
