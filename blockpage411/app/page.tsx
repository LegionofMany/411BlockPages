import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import ChainCarousel from "./components/landing/ChainCarousel";
import UserProfile from "./components/landing/UserProfile";
import SampleWallet from "./components/landing/SampleWallet";
import PopularWallets from "./components/landing/PopularWallets";
import RealTimeTransactions from "./components/landing/RealTimeTransactions";
import AdminAccessButton from "./components/admin/AdminAccessButton";
import ThemeProvider from "./components/ThemeProvider";
import Testimonials from "./components/landing/Testimonials";
import StaggerStarter from './components/StaggerStarter';

export default function Page() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#181f2f] to-[#1a2236] text-white flex flex-col relative overflow-x-hidden">
        <Navbar variant="landing" />
        <main className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Admin button only visible to admin wallets (pushed below fixed navbar) */}
        <div className="w-full flex justify-center mt-20">
          <AdminAccessButton />
        </div>
        <Hero />
        <UserProfile />
        <ChainCarousel />
        <Features />
        <Testimonials />
        <PopularWallets />
        <RealTimeTransactions />
        <SampleWallet />
      </main>
      <Footer />
      <StaggerStarter />
    </div>
    </ThemeProvider>
  );
}
