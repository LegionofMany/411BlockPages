import Footer from "./components/Footer";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import ChainCarousel from "./components/landing/ChainCarousel";
import SampleWallet from "./components/landing/SampleWallet";
import PopularWallets from "./components/landing/PopularWallets";
import RealTimeTransactions from "./components/landing/RealTimeTransactions";
import Testimonials from "./components/landing/Testimonials";
import ThemeProvider from "./components/ThemeProvider";

export default function Page() {
  return (
    <ThemeProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <main className="flex-1 flex flex-col items-center justify-center w-full pt-20">
          <Hero />
          <ChainCarousel />
          <Features />
          <RealTimeTransactions />
          <PopularWallets />
          <SampleWallet />
          <Testimonials />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
