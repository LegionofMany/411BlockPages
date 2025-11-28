"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const LiveStats = dynamic(() => import('./LiveStats'), { ssr: false });

export default function LiveStatsClient(props: { apiUrl?: string }) {
  return <LiveStats {...props} />;
}
