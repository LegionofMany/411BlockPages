"use client";
import { useRouter } from "next/navigation";
import { Button } from "app/components/ui/Button";

export default function Hero() {
  const router = useRouter();
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full max-w-6xl mx-auto px-4 pt-20 pb-12 text-center sm:pt-24 sm:pb-20"
      // Inline width cap to avoid full-bleed layout being forced by global styles.
      // This inline style intentionally overrides any global/container rules.
      style={{ maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' }}
    >
      {/* Radiant blockchain glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[120%] -translate-x-1/2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14)_0%,_rgba(15,23,42,0)_60%)]" />
      </div>

      <div
        className="relative z-10 space-y-6 rounded-[1.75rem] px-4 sm:px-8 py-10 sm:py-12 mx-auto max-w-5xl"
        style={{
          backgroundColor: "rgba(0,0,0,0.82)",
          boxShadow: "0 26px 70px rgba(0,0,0,0.95)",
          backdropFilter: "blur(26px)",
          WebkitBackdropFilter: "blur(26px)",
        }}
      >
        <h1
          id="hero-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-[0_0_22px_rgba(250,250,210,0.45)]"
          style={{
            color: "rgba(252, 211, 77, 0.95)",
            textShadow: "0 0 18px rgba(252, 211, 77, 0.55)",
          }}
        >
          Blockpage411: Your On‑Chain Reputation Layer
        </h1>

        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-7 mb-12">
          <p className="text-sm sm:text-base md:text-lg font-medium text-[#FDE68A] leading-relaxed drop-shadow-[0_0_10px_rgba(250,250,210,0.35)]">
            Discover verified wallet profiles and trust signals across multiple chains. Combine community reviews,
            on-chain heuristics, and curated risk indicators to understand wallet history, flag suspicious activity,
            and make safer decisions in Web3.
          </p>
        </div>

        {/* Spacer to create clear separation between card and buttons */}
        <div aria-hidden="true" className="w-full" style={{ height: "20px" }} />

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Button
            type="button"
            size="lg"
            className="w-3/4 max-w-xs sm:w-auto sm:min-w-[10rem] text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#A855F7] text-slate-950 shadow-[0_16px_40px_rgba(250,204,21,0.45)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-px active:brightness-95"
            leftIcon={<span className="text-lg">🚀</span>}
            onClick={() => router.push("/login")}
            aria-label="Claim your profile"
          >
            Claim Your Profile
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-3/4 max-w-xs sm:w-auto sm:min-w-[10rem] text-sm sm:text-base md:text-lg font-semibold bg-slate-950/90 text-amber-100 shadow-[0_10px_32px_rgba(15,23,42,0.85)] hover:bg-slate-900 active:translate-y-px"
            leftIcon={<span className="text-lg">🔍</span>}
            onClick={() => router.push("/search")}
            aria-label="Explore wallets"
          >
            Explore Wallets
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-xs font-mono text-amber-300/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          <span>Live on-chain intelligence · Multi-chain coverage · Community powered</span>
        </div>
      </div>
    </section>
  );
}
