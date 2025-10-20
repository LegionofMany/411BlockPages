"use client";

import React, { useEffect, useRef, useState } from "react";

type RiskMeterProps = { score?: number | null; category?: string | null; size?: number };

function clamp(v: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, v));
}

export default function RiskMeter({ score, category, size = 160 }: RiskMeterProps) {
  const target = typeof score === "number" ? clamp(Math.round(score)) : null;
  const [value, setValue] = useState<number>(target ?? 0);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState<number>(0);

  useEffect(() => {
    if (target === null) return;
    const from = value;
    const to = target;
    const start = performance.now();
    const duration = 600;
    let raf = 0;
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const cur = Math.round(from + (to - from) * eased);
      setValue(cur);
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    setPathLen(len);
    pathRef.current.style.transition = "stroke-dashoffset 650ms ease-out";
  }, []);

  const percent = clamp(value);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;
  const d = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  const dashOffset = pathLen ? pathLen * (1 - percent / 100) : 0;
  const color = percent >= 90 ? "#0b0b0b" : percent >= 70 ? "#dc2626" : percent >= 40 ? "#f59e0b" : "#10b981";

  return (
    <div className="w-full flex items-center gap-4 py-4">
      <div className="w-40 h-24 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path d={d} fill="none" stroke="#0f1720" strokeWidth={12} strokeLinecap="round" opacity={0.5} />
          <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={pathLen} strokeDashoffset={dashOffset} />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold text-cyan-200">{percent}%</div>
          <div className="text-sm text-gray-400">Risk Score</div>
        </div>
        <div className="mt-1 text-sm text-gray-300">{(category || "unknown").toString().toUpperCase()} — {percent >= 90 ? "Unverified / High risk" : percent >= 70 ? "Flagged / High risk" : percent >= 40 ? "Caution / Moderate risk" : "Verified / Low risk"}</div>
        <div className="mt-2 text-xs text-gray-500">Higher values indicate higher tax/risk exposure. Meter updates smoothly.</div>
      </div>
    </div>
  );
}
