"use client";

import { PRICE } from "./data";

function fmtAUM(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function MiniRange({
  low,
  high,
  current,
}: {
  low: number;
  high: number;
  current: number;
}) {
  const span = high - low || 1;
  const pct = Math.max(0, Math.min(1, (current - low) / span));
  return (
    <div className="relative h-[4px] w-full bg-[var(--surface-2)] rounded-full">
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-2 ring-[var(--surface-1)]"
        style={{ left: `calc(${pct * 100}% - 4px)`, background: "var(--fg)" }}
      />
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="h-eyebrow">{label}</span>
      {children}
    </div>
  );
}

/**
 * Compact horizontal vitals strip designed to sit inside the chart card,
 * just below the main chart. Replaces the old 6-card SnapshotGrid; Volume
 * and NAV intentionally dropped per the design pass.
 */
export function ChartVitals() {
  const P = PRICE;
  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3">
      <Stat label="Open">
        <span className="num text-[var(--fg)] text-[13px]">
          ${P.open.toFixed(2)}
        </span>
      </Stat>
      <Stat label="Prev close">
        <span className="num text-[var(--fg)] text-[13px]">
          ${P.prevClose.toFixed(2)}
        </span>
      </Stat>
      <div className="col-span-2 md:col-span-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="h-eyebrow">Day range</span>
          <span className="text-[10px] num text-[var(--fg-tertiary)]">
            ${P.dayRange[0].toFixed(2)}–${P.dayRange[1].toFixed(2)}
          </span>
        </div>
        <MiniRange
          low={P.dayRange[0]}
          high={P.dayRange[1]}
          current={P.current}
        />
      </div>
      <div className="col-span-2 md:col-span-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="h-eyebrow">52-week</span>
          <span className="text-[10px] num text-[var(--fg-tertiary)]">
            ${P.week52Range[0].toFixed(2)}–${P.week52Range[1].toFixed(2)}
          </span>
        </div>
        <MiniRange
          low={P.week52Range[0]}
          high={P.week52Range[1]}
          current={P.current}
        />
      </div>
      <Stat label="AUM">
        <span className="num text-[var(--fg)] text-[13px]">
          {fmtAUM(P.aum)}
        </span>
      </Stat>
    </div>
  );
}
