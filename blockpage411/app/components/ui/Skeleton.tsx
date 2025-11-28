"use client";
import React from 'react';

export default function Skeleton({ className = 'h-4 w-full bg-slate-800 rounded', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={className + ' animate-pulse'} style={style} />;
}
