"use client";

import DiscordCommunitySection from './DiscordCommunitySection';

// NOTE: This file is kept for backwards compatibility with older imports.
// Discord is a public community feature and must not be gated behind auth or wallet connection.

export default function DiscordWidget({ className = '' }: { className?: string }) {
  return <DiscordCommunitySection className={className} compact />;
}
