'use client';
import { motion, Variants } from 'framer-motion';
import { FiLayers, FiShield, FiThumbsUp, FiUserCheck, FiTrendingUp, FiAward } from 'react-icons/fi';

const features = [
  { 
    icon: FiLayers,
    title: 'Multi-Chain Support',
    description: 'Track and verify wallets across major blockchains including Ethereum, Solana, Bitcoin, and more.',
  },
  {
    icon: FiShield,
    title: 'Comprehensive Risk Analysis',
    description: 'Our advanced heuristics identify suspicious activities, providing a clear risk score for every wallet.',
  },
  {
    icon: FiThumbsUp,
    title: 'Community-Driven Reputation',
    description: 'Leverage community-driven ratings and reviews to gauge wallet trustworthiness.',
  },
  {
    icon: FiUserCheck,
    title: 'Verified Identity Credentials',
    description: 'Confirm wallet ownership and identity through optional KYC and social verification badges.',
  },
  {
    icon: FiTrendingUp,
    title: 'Real-Time Threat Intelligence',
    description: 'Stay ahead of scams with continuous monitoring and real-time alerts on fraudulent activities.',
  },
  {
    icon: FiAward,
    title: 'Build Your On-Chain Resume',
    description: 'Showcase your transaction history, reputation, and credentials to build trust in the ecosystem.',
  },
];

export default function Features() {
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
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ color: '#e6d6a7', position: 'relative', zIndex: 1 }}
    >
      {/* Confine the radial overlay to this section (use inset-0 instead of 200% width) so it can't overflow into the previous section */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(250,204,21,0.06)_0%,_rgba(250,204,21,0)_60%)]" />
      </div>
      <div className='relative container mx-auto px-4' style={{ zIndex: 5, position: 'relative' }}>
        <div className='text-center max-w-3xl mx-auto'>
          <h2 id="features-heading" className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400'>
            A New Standard for Trust in Web3
          </h2>
          <p className='text-sm sm:text-base md:text-lg text-slate-400 mb-12'>
            Blockpage411 is more than a wallet scanner — it combines community signals, on-chain analytics, and curated provider intelligence to help you decide who to trust.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial='offscreen'
              whileInView='onscreen'
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
              transition={{ delay: i * 0.1 }}
              className="backdrop-blur-lg rounded-2xl overflow-hidden transition-colors duration-300 focus-within:ring-2 focus-within:ring-indigo-500"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(250,204,21,0.06)' }}
            >
              <div className='p-6'>
                <div
                  className='flex items-center justify-center w-12 h-12 rounded-2xl mb-4 sm:mb-6'
                  style={{ backgroundColor: 'rgba(250,204,21,0.06)' }}
                >
                  <feature.icon style={{ width: 24, height: 24, color: '#facc15' }} />
                </div>
                <h3 className='text-xl font-bold mb-3' style={{ color: '#e6d6a7' }}>{feature.title}</h3>
                <p className='text-sm sm:text-base' style={{ color: '#facc15' }}>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}