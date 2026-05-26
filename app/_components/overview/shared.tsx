"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useDataset } from "./dataset";
import { RangeBar } from "./RangeBar";

// ─── AnimatedNumber ──────────────────────────────────────────────────────────
export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  duration = 700,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    const from = prev.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else prev.current = to;
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  const formatted = Number(display).toLocaleString("en-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span className={`num ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  width = 132,
  height = 36,
  color = "currentColor",
  fill = true,
  strokeWidth = 1.5,
}: {
  data: { t: number; price: number }[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  if (!data || !data.length) return null;
  const xs = data.map((d) => d.t);
  const ys = data.map((d) => d.price);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const dx = maxX - minX || 1,
    dy = maxY - minY || 1;
  const pts = data.map((d) => {
    const x = ((d.t - minX) / dx) * width;
    const y = height - ((d.price - minY) / dy) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = pts
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(2) + "," + p[1].toFixed(2))
    .join(" ");
  const area = path + ` L ${width},${height} L 0,${height} Z`;
  const gid = "spk" + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" />
    </svg>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between mb-4 gap-4">
      <div>
        {eyebrow && <div className="h-eyebrow mb-1">{eyebrow}</div>}
        <h2 className="h-title">{title}</h2>
        {subtitle && (
          <p className="text-[13px] text-[var(--fg-tertiary)] mt-1 max-w-[640px]">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </header>
  );
}

// ─── Reveal — pass-through wrapper (animations elsewhere) ────────────────────
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

// ─── SnapshotGrid ────────────────────────────────────────────────────────────
function SnapshotCard({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="card card-pad flex flex-col justify-between min-h-[120px]">
      <div className="flex items-center justify-between">
        <span className="h-eyebrow">{label}</span>
        {hint && (
          <span className="text-[10px] text-[var(--fg-tertiary)] num">
            {hint}
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function SnapshotGrid() {
  const { PRICE } = useDataset();
  const P = PRICE;
  const fmtAUM = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };
  const volRatio = P.volume / P.avgVolume20d;
  return (
    <section className="mt-10">
      <SectionHeader
        eyebrow="Snapshot"
        title="Today at a glance"
        right={
          <span className="text-[11px] text-[var(--fg-tertiary)]">
            As of{" "}
            {new Date().toLocaleDateString("en-CA", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SnapshotCard label="Open">
          <div className="text-[22px] font-medium text-[var(--fg)] num">
            ${P.open.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--fg-tertiary)] mt-1 num">
            Prev close ${P.prevClose.toFixed(2)}
          </div>
        </SnapshotCard>

        <SnapshotCard label="Day range">
          <div className="text-[20px] font-medium text-[var(--fg)] num">
            ${P.dayRange[0].toFixed(2)}
            <span className="text-[var(--fg-tertiary)] mx-1.5 font-normal text-[14px]">
              –
            </span>
            ${P.dayRange[1].toFixed(2)}
          </div>
          <div className="mt-3">
            <RangeBar
              low={P.dayRange[0]}
              high={P.dayRange[1]}
              current={P.current}
            />
          </div>
        </SnapshotCard>

        <SnapshotCard label="52-week range">
          <div className="text-[20px] font-medium text-[var(--fg)] num">
            ${P.week52Range[0].toFixed(2)}
            <span className="text-[var(--fg-tertiary)] mx-1.5 font-normal text-[14px]">
              –
            </span>
            ${P.week52Range[1].toFixed(2)}
          </div>
          <div className="mt-3">
            <RangeBar
              low={P.week52Range[0]}
              high={P.week52Range[1]}
              current={P.current}
            />
          </div>
        </SnapshotCard>

        <SnapshotCard label="Volume" hint={`${volRatio.toFixed(2)}× avg`}>
          <div className="text-[22px] font-medium text-[var(--fg)] num">
            {P.volume.toLocaleString("en-CA")}
          </div>
          <div className="text-[11px] text-[var(--fg-tertiary)] mt-1">
            20-day avg {P.avgVolume20d.toLocaleString("en-CA")}
          </div>
        </SnapshotCard>

        <SnapshotCard label="NAV">
          <div className="text-[22px] font-medium text-[var(--fg)] num">
            ${P.nav.toFixed(2)}
          </div>
          <div
            className={
              "text-[11px] mt-1 num " +
              (P.current >= P.nav ? "text-[var(--gain)]" : "text-[var(--loss)]")
            }
          >
            {P.current >= P.nav ? "Premium " : "Discount "}
            {(((P.current - P.nav) / P.nav) * 100).toFixed(2)}%
          </div>
        </SnapshotCard>

        <SnapshotCard label="AUM">
          <div className="text-[22px] font-medium text-[var(--fg)] num">
            {fmtAUM(P.aum)}
          </div>
          <div className="text-[11px] text-[var(--fg-tertiary)] mt-1">
            Net assets
          </div>
        </SnapshotCard>
      </div>
    </section>
  );
}

// ─── ReturnsTable ────────────────────────────────────────────────────────────
export function ReturnsTable() {
  const { RETURNS } = useDataset();
  const cols = ["1D", "1W", "1M", "3M", "YTD", "1Y", "SI"] as const;
  const labels: Record<string, string> = {
    "1D": "1 day",
    "1W": "1 week",
    "1M": "1 month",
    "3M": "3 months",
    YTD: "YTD",
    "1Y": "1 year",
    SI: "Since inception",
  };
  const fund = RETURNS.fund;
  const bench = RETURNS.benchmark;
  const diff = Object.fromEntries(
    cols.map((c) => [c, +(fund[c] - bench[c]).toFixed(2)])
  ) as Record<string, number>;

  const Cell = ({ v }: { v: number }) => {
    const cls =
      v > 0
        ? "text-[var(--gain)]"
        : v < 0
        ? "text-[var(--loss)]"
        : "text-[var(--fg-secondary)]";
    const sign = v > 0 ? "+" : "";
    return (
      <td className={`px-4 py-3 text-right num ${cls}`}>
        {sign}
        {v.toFixed(2)}%
      </td>
    );
  };

  return (
    <section className="mt-12">
      <SectionHeader
        eyebrow="History"
        title="Performance"
        subtitle="Total return, net of fees. Past performance does not predict future results."
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="h-eyebrow">
              <th className="text-left font-normal px-4 py-3 w-[160px]">
                Series
              </th>
              {cols.map((c) => (
                <th key={c} className="text-right font-normal px-4 py-3">
                  {labels[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <tr>
              <td className="px-4 py-3 text-[var(--fg)]">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                  CAGE
                </span>
              </td>
              {cols.map((c) => (
                <Cell key={c} v={fund[c]} />
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-[var(--fg-secondary)]">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--fg-tertiary)]" />
                  ACWI IMI
                </span>
              </td>
              {cols.map((c) => (
                <Cell key={c} v={bench[c]} />
              ))}
            </tr>
            <tr className="bg-[var(--surface-2)]">
              <td className="px-4 py-3 text-[var(--fg-tertiary)] text-[12px]">
                Excess vs. benchmark
              </td>
              {cols.map((c) => (
                <Cell key={c} v={diff[c]} />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
