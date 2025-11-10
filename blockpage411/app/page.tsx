import Footer from "./components/Footer";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import ChainCarousel from "./components/landing/ChainCarousel";
import SampleWallet from "./components/landing/SampleWallet";
import PopularWallets from "./components/landing/PopularWallets";
import RealTimeTransactions from "./components/landing/RealTimeTransactions";
import Testimonials from "./components/landing/Testimonials";
import TrustBadges from "./components/landing/TrustBadges";
import LiveStats from "./components/landing/LiveStats";
import LandingSearchDemo from "./components/landing/LandingSearchDemo";
import SocialProof from "./components/landing/SocialProof";
import FAQ from "./components/landing/FAQ";
import ThemeProvider from "./components/ThemeProvider";

export default function Page() {
  return (
    <ThemeProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-20">
          <Hero />
          <TrustBadges />
          <LandingSearchDemo />
          <LiveStats />
          <ChainCarousel />
          <Features />
          <RealTimeTransactions />
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
