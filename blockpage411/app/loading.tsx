export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#020617" }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center shadow-2xl">
        <div className="text-lg font-semibold text-slate-100">Loading…</div>
        <div className="mt-2 text-sm text-slate-300">Warming up Blockpage411</div>
      </div>
    </div>
  );
}
