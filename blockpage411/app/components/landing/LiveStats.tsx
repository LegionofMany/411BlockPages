"use client";
import { useEffect, useState } from 'react';
import ClientOnlyMotion from '../ClientOnlyMotion';

type Stat = { label: string; value: number; id: string };

function useAnimatedNumber(target: number, duration = 800) {
  const [num, setNum] = useState(0);
  useEffect(() => {
    let raf: number | undefined;
    const start = performance.now();
    const from = num;
    const tick = (ts: number) => {
      const t = Math.min(1, (ts - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // simple ease
      const next = Math.round((from + (target - from) * eased));
      setNum(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return num;
}

export default function LiveStats({ apiUrl = '/api/stats/sample' }: { apiUrl?: string }) {
  const [stats, setStats] = useState<Stat[]>([]);
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const res = await fetch(apiUrl);
        const js = await res.json();
        if (!mounted) return;
        const s: Stat[] = [
          { id: 'flagged', label: 'Wallets Flagged', value: js.flagged || 1245 },
          { id: 'ratings', label: 'Ratings Submitted', value: js.ratings || 37812 },
          { id: 'chains', label: 'Blockchains Supported', value: js.chains || 12 },
        ];
        setStats(s);
      } catch (e) {
        console.error('live stats fetch error', e);
      }
    }
    fetchStats();
    const iv = setInterval(fetchStats, 30_000);
    return () => { mounted = false; clearInterval(iv); };
  }, [apiUrl]);

  return (
    <section aria-label="Live site stats" className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((s) => (
          <StatCard key={s.id} stat={s} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const num = useAnimatedNumber(stat.value, 900);
  return (
    <ClientOnlyMotion
      className="p-6 rounded-2xl text-center"
      data-while-hover
      whileHover={{ translateY: -6 } as any}
      style={{
        backgroundColor: "rgba(0,0,0,0.86)",
        boxShadow: "0 22px 64px rgba(0,0,0,0.95)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "none",
      }}
    >
      <div className="text-4xl font-extrabold" style={{ color: '#ffd67a' }}>{num.toLocaleString()}</div>
      <div className="text-sm mt-2" style={{ color: 'var(--muted-text)' }}>{stat.label}</div>
    </ClientOnlyMotion>
  );
}
