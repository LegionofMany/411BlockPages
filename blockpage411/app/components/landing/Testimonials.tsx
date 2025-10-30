"use client";

const testimonials = [
  {
    quote: "A fast way to check wallet reputations. Helped our audit team prioritize investigations.",
    author: "DeFi Audit Team",
    role: "Security Researcher"
  },
  {
    quote: "Nice UX and clear flags. Great for onboarding new donors and ensuring trust.",
    author: "Public Goods Organizer",
    role: "Community Manager"
  },
  {
    quote: "Excellent visibility into on-chain activity and trust signals. An indispensable tool for research.",
    author: "On-Chain Analyst",
    role: "Data Scientist"
  }
];

export default function Testimonials() {
  return (
    <section className="w-full max-w-6xl mx-auto text-center py-16 px-4">
      <h2
        className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(255,223,99,0.98) 0%, rgba(245,158,11,0.95) 60%)'
        }}
      >
        Trusted by the Community
      </h2>
      <p
        className="mb-12 max-w-2xl mx-auto"
        style={{
          color: 'rgba(255, 223, 99, 0.92)',
          background: 'linear-gradient(90deg, rgba(255,223,99,0.04), rgba(255,223,99,0.01))',
          padding: '0.35rem 0.9rem',
          borderRadius: 10,
          backdropFilter: 'blur(6px)'
        }}
      >
        Used by wallet owners, auditors, and public goods contributors to navigate Web3 with confidence. These stories highlight how Blockpage411 surfaces meaningful signals, accelerates investigations, and builds trust across chains.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial) => (
          <blockquote
            key={testimonial.author}
            className="p-6 bg-[rgba(8,12,20,0.46)] backdrop-blur-lg rounded-2xl shadow-lg text-left"
            style={{
              border: '1px solid rgba(10,40,90,0.7)'
            }}
          >
            <p className="mb-4" style={{ color: 'rgba(255,215,90,0.98)', lineHeight: 1.6 }}>&quot;{testimonial.quote}&quot;</p>
            <cite className="not-italic">
              <span className="block font-bold" style={{ color: 'rgba(255,223,99,0.98)' }}>{testimonial.author}</span>
              <span className="block text-sm" style={{ color: 'rgba(255,223,99,0.72)' }}>{testimonial.role}</span>
            </cite>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
