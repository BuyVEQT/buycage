"use client";

export function RangeBar({
  low,
  high,
  current,
  format = (v: number) => "$" + v.toFixed(2),
}: {
  low: number;
  high: number;
  current: number;
  format?: (v: number) => string;
}) {
  const span = high - low || 1;
  const pct = Math.max(0, Math.min(1, (current - low) / span));
  return (
    <div>
      <div className="relative h-[6px] bg-[var(--surface-2)] rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--surface-1)]"
          style={{ left: `calc(${pct * 100}% - 5px)`, background: "var(--fg)" }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] num text-[var(--fg-tertiary)]">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>
    </div>
  );
}
