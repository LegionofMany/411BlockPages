"use client";

type RiskGaugeProps = {
  score: number; // 0-100
};

function getRiskMeta(score: number) {
  if (score <= 30) return { label: "Low", color: "#22c55e" };
  if (score <= 70) return { label: "Medium", color: "#f97316" };
  return { label: "High", color: "#ef4444" };
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const { label, color } = getRiskMeta(clamped);

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${color}, rgba(15,23,42,1))`,
            boxShadow: `0 0 12px ${color}80`,
          }}
        />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
        {label} · {clamped.toFixed(0)}
      </span>
    </div>
  );
}
