"use client";
import { motion, Variants } from "framer-motion";

function FeatureIcon({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-6 w-6 items-center justify-center text-[13px] font-semibold"
      style={{ color: "#facc15" }}
    >
      {label}
    </span>
  );
}

const features = [
  {
    iconLabel: "MC",
    title: 'Multi-Chain Support',
    description: 'Track and verify wallets across major blockchains including Ethereum, Solana, Bitcoin, and more.',
  },
  {
    iconLabel: "RA",
    title: 'Comprehensive Risk Analysis',
    description: 'Our advanced heuristics identify suspicious activities, providing a clear risk score for every wallet.',
  },
  {
    iconLabel: "CR",
    title: 'Community-Driven Reputation',
    description: 'Leverage community-driven ratings and reviews to gauge wallet trustworthiness.',
  },
  {
    iconLabel: "ID",
    title: 'Verified Identity Credentials',
    description: 'Confirm wallet ownership and identity through optional KYC and social verification badges.',
  },
  {
    iconLabel: "TI",
    title: 'Real-Time Threat Intelligence',
    description: 'Stay ahead of scams with continuous monitoring and real-time alerts on fraudulent activities.',
  },
  {
    iconLabel: "PR",
    title: 'Build Your On-Chain Resume',
    description: 'Showcase your transaction history, reputation, and credentials to build trust in the ecosystem.',
  },
];

export default function FeaturesClient() {
  const cardVariants: Variants = {
    offscreen: {
      opacity: 0,
      y: 50,
    },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.4,
        duration: 0.8,
      },
    },
  };

  return (
    <section
      aria-labelledby="features-heading"
      className="relative py-16 md:py-24 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.16)_0%,_rgba(15,23,42,0)_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle_at_center,_rgba(250,204,21,0.18)_0%,_rgba(15,23,42,0)_70%)] blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: "#22c55e" }}>
            Platform pillars
          </p>
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3"
            style={{ color: "#22c55e" }}
          >
            A new standard for trust in Web3
          </h2>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: "#22c55e" }}>
            Blockpage411 blends community reputation, on-chain intelligence, and curated provider data into one
            coherent signal for who you should trust with your time, capital, and community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {features.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.45 }}
              variants={cardVariants}
              transition={{ delay: i * 0.06 }}
              className="group relative rounded-2xl px-5 py-6 overflow-hidden"
              style={{
                backgroundColor: "rgba(0,0,0,0.88)",
                borderRadius: "1rem",
                border: "none",
                boxShadow: "0 22px 64px rgba(0,0,0,0.95)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
              }}
            >
              <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 0%, rgba(250,204,21,0.22), rgba(0,0,0,0.4))",
                      boxShadow: "0 0 0 2px rgba(250,204,21,0.85), 0 16px 46px rgba(250,204,21,0.75)",
                    }}
                    aria-hidden="true"
                  >
                    <FeatureIcon label={feature.iconLabel} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 group-hover:text-slate-300">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ color: "#22c55e" }}>
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-4 flex-1"
                  style={{ color: "#22c55e" }}
                >
                  {feature.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 text-sky-300/90 group-hover:text-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:bg-amber-300" />
                    Live on mainnet
                  </span>
                  <span className="hidden sm:inline text-slate-500 group-hover:text-slate-300">Designed for security teams & DAOs</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
