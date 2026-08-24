import type { CSSProperties } from 'react';

function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 stagger-child">
          <Bone className="h-2.5 w-20 mb-3" />
          <Bone className="h-7 w-16 mb-2" />
          <Bone className="h-2 w-28" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 stagger-child">
          <Bone className="h-2.5 w-32 mb-5" />
          <div className="flex items-end gap-2.5 h-[280px] pt-6">
            {Array.from({ length: 6 }).map((_, j) => (
              <Bone key={j} className="flex-1" style={{ height: `${30 + Math.random() * 60}%`, animationDelay: `${j * 80}ms` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden stagger-child">
      <div className="px-5 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-7 w-24 rounded-lg" />
      </div>
      <div className="p-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 stagger-child" style={{ animationDelay: `${i * 40}ms` }}>
            <Bone className="h-3.5 w-14" />
            <Bone className="h-3.5 flex-1" />
            <Bone className="h-3.5 w-18" />
            <Bone className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="stagger-child">
        <Bone className="h-7 w-56 mb-1.5" />
        <Bone className="h-3 w-80" />
      </div>
      <KpiSkeleton count={4} />
      <ChartSkeleton count={2} />
      <TableSkeleton />
    </div>
  );
}