import { useEffect, useRef, useState } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}

function useCountUp(target: number | null, duration = 700, delay = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target == null || target === 0) { setCount(target ?? 0); return; }
    const start = performance.now() + delay;
    const animate = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) { frameRef.current = requestAnimationFrame(animate); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, delay]);

  return count;
}

export function KpiCard({ title, value, subtitle, icon, color = 'teal', delay = 0 }: KpiCardProps) {
  const colorClass = color === 'indigo' ? 'kpi-card-indigo'
    : color === 'amber' ? 'kpi-card-amber'
    : color === 'rose' ? 'kpi-card-rose'
    : color === 'green' ? 'kpi-card-green'
    : '';

  const numericValue = typeof value === 'number' ? value
    : typeof value === 'string' ? (() => {
        const clean = value.replace(/[^0-9.-]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
      })()
    : null;

  const suffix = typeof value === 'string' ? value.replace(/[0-9.,-]/g, '') : '';
  const animatedCount = useCountUp(numericValue, 800, delay + 150);

  return (
    <div
      className={`kpi-card ${colorClass} stagger-child`}
      style={{ width: '100%', minWidth: 0 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider truncate">{title}</p>
          <p className="text-[28px] font-bold mt-1.5 tracking-tight text-[var(--text-heading)] leading-tight animate-count" style={{ animationDelay: `${delay + 80}ms` }}>
            {numericValue != null ? animatedCount.toLocaleString() : value}{suffix}
          </p>
          {subtitle && <p className="text-[11px] text-[var(--text-muted)] mt-1">{subtitle}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] shrink-0 animate-scale-in" style={{ animationDelay: `${delay + 200}ms` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}