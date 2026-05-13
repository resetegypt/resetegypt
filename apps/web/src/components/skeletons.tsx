import { type ReactNode } from 'react';

// ============================================================================
// Skeleton loaders — composants de placeholder animés.
// Pulse d'opacité avec gradient subtil pour évoquer du contenu en chargement.
// ============================================================================

interface SkelProps {
  className?: string;
  /** Hauteur en classes Tailwind (ex: 'h-4', 'h-12') */
}

export function Skel({ className = '' }: SkelProps) {
  return (
    <div
      className={`bg-bg-secondary rounded animate-pulse relative overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        style={{ animation: 'shimmer 2s infinite' }}
      />
    </div>
  );
}

// === Cartes & lignes =========================================================

export function SkelLine({ className = '' }: SkelProps) {
  return <Skel className={`h-3 ${className}`} />;
}

export function SkelCircle({ size = 32 }: { size?: number }) {
  return (
    <div
      className="bg-bg-secondary rounded-full animate-pulse shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function SkelCard({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
      {children ?? (
        <>
          <SkelLine className="w-1/3" />
          <SkelLine className="w-2/3" />
          <SkelLine className="w-1/2" />
        </>
      )}
    </div>
  );
}

// === KPI grid skeleton (dashboard / agenda / stats) =========================

export function SkelKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${Math.min(count, 4)} gap-4`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skel className="h-3 w-1/2" />
            <SkelCircle size={32} />
          </div>
          <Skel className="h-8 w-2/3" />
          <Skel className="h-2 w-3/4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// === Liste skeleton (patients, waiting list, inbox) =========================

export function SkelList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface divide-y divide-border-light overflow-hidden">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-4">
          <SkelCircle size={40} />
          <div className="flex-1 space-y-2">
            <Skel className="h-3 w-1/3" />
            <Skel className="h-2.5 w-2/3" />
          </div>
          <Skel className="h-7 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// === Table skeleton ==========================================================

export function SkelTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3 bg-bg-secondary/40 border-b border-border-light grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skel key={i} className="h-3 w-2/3" />
        ))}
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="px-5 py-3 grid gap-4 items-center"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }, (_, c) => (
              <Skel key={c} className={`h-3 ${c === 0 ? 'w-3/4' : c === cols - 1 ? 'w-1/2' : 'w-2/3'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// === Agenda grid skeleton (semaine) =========================================

export function SkelAgendaWeek() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="grid border-b border-border-light bg-bg-secondary/40" style={{ gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))' }}>
        <div className="p-3" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="p-3 space-y-1">
            <Skel className="h-2 w-1/2" />
            <Skel className="h-5 w-2/3" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: 6 }, (_, r) => (
          <div key={r} className="grid" style={{ gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))' }}>
            <div className="p-2 flex items-start justify-end">
              <Skel className="h-2 w-8" />
            </div>
            {Array.from({ length: 7 }, (_, c) => (
              <div key={c} className="p-1 min-h-[52px]">
                {(r + c) % 5 === 0 && <Skel className="h-full w-full rounded-md" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// === Chart skeleton ==========================================================

export function SkelChart({ height = 160 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Skel className="h-3 w-1/4 mb-4" />
      <div className="flex items-end gap-2 px-2" style={{ height }}>
        {Array.from({ length: 14 }, (_, i) => (
          <Skel
            key={i}
            className="flex-1 rounded-t"
            // Hauteurs aléatoires-déterministes pour un effet vivant
          />
        ))}
      </div>
    </div>
  );
}
