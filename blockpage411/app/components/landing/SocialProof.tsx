"use client";
import { FiTwitter, FiGithub } from 'react-icons/fi';

export default function SocialProof() {
  const links = [
    { name: 'Twitter', href: 'https://twitter.com', Icon: FiTwitter, count: '12.3k' },
    { name: 'GitHub', href: 'https://github.com', Icon: FiGithub, count: '2.1k' },
    { name: 'Discord', href: 'https://discord.com', Icon: FiTwitter, count: '8.7k' },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center gap-6">
        {links.map(l => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded hover:bg-white/6">
            <l.Icon />
            <span className="text-sm font-medium">{l.count} {l.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
