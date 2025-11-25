"use client";

type ChainPillProps = {
  chain: string;
  network?: string;
};

export function ChainPill({ chain, network }: ChainPillProps) {
  const label = network ? `${chain} · ${network}` : chain;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide"
      style={{
        background:
          "radial-gradient(circle at 30% 0%, rgba(34,197,94,0.22), rgba(0,0,0,0.7))",
        boxShadow: "0 0 0 1px rgba(34,197,94,0.75), 0 12px 30px rgba(34,197,94,0.7)",
        color: "#bbf7d0",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "#22c55e" }}
      />
      <span>{label}</span>
    </span>
  );
}
