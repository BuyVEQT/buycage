"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Line,
} from "recharts";
import type { Bar, SeriesPoint } from "./data";
import { useDataset } from "./dataset";

const TF_ORDER = ["1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"] as const;
type TF = (typeof TF_ORDER)[number];

// Minimum daily bars required for a meaningful render. (1D is special —
// it draws from the day's quote, not from the daily history series.)
const TF_MIN_BARS: Record<TF, number> = {
  "1D": 0,
  "1W": 5,
  "1M": 22,
  "3M": 63,
  YTD: 1,
  "1Y": 252,
  ALL: 1,
};

const MODES = [
  { id: "price", label: "Price", desc: "Closing price over time." },
  { id: "drawdown", label: "Drawdown", desc: "% below the trailing peak." },
  {
    id: "rolling",
    label: "Rolling 30d",
    desc: "30-day total return at each point.",
  },
] as const;
type Mode = (typeof MODES)[number]["id"];

function fmtMoneyC(n: number, digits = 2) {
  return n.toLocaleString("en-CA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const axisFormatPrice = (v: number) => `$${v.toFixed(2)}`;
const axisFormatPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

function tooltipDate(t: number, tf: TF) {
  const d = new Date(t);
  if (tf === "1D")
    return d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  if (tf === "1W")
    return d.toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  return d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function axisTickFormatter(t: number, tf: TF) {
  const d = new Date(t);
  if (tf === "1D")
    return d.toLocaleTimeString("en-CA", { hour: "numeric", hour12: true });
  if (tf === "1W") return d.toLocaleDateString("en-CA", { weekday: "short" });
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function TFPill({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-disabled={disabled}
      className={
        "px-2.5 h-7 text-[11.5px] font-medium tracking-wide rounded-md transition-all duration-200 " +
        (disabled
          ? "text-[var(--fg-tertiary)] opacity-40 cursor-not-allowed"
          : active
          ? "bg-[var(--surface-2)] text-[var(--fg)] ring-1 ring-[var(--border)]"
          : "text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]")
      }
    >
      {children}
    </button>
  );
}

function ModeTab({
  active,
  onClick,
  children,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      title={hint}
      className={
        "relative px-3 h-8 text-[12px] font-medium tracking-tight rounded-md transition-colors " +
        (active
          ? "text-[var(--fg)]"
          : "text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]")
      }
    >
      {children}
      {active && (
        <span
          className="absolute -bottom-[1px] left-2 right-2 h-[2px] rounded-full"
          style={{ background: "var(--accent)" }}
        />
      )}
    </button>
  );
}

type TooltipPayload = { dataKey?: string; value?: number }[];

function ChartTooltip({
  active,
  payload,
  label,
  tf,
  showBench,
  mode,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: number;
  tf: TF;
  showBench: boolean;
  mode: Mode;
}) {
  if (!active || !payload || !payload.length || label == null) return null;
  const fundPt = payload.find((p) => p.dataKey === "price");
  const benchPt = payload.find((p) => p.dataKey === "bench");
  const fmt =
    mode === "price"
      ? (v: number) => `$${fmtMoneyC(v)}`
      : (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
  return (
    <div className="card card-pad py-2 px-3 text-[12px] min-w-[140px] shadow-xl">
      <div className="text-[var(--fg-tertiary)] mb-1 num">
        {tooltipDate(label, tf)}
      </div>
      {fundPt && fundPt.value != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[var(--fg-secondary)]">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            CAGE
          </span>
          <span className="font-medium num text-[var(--fg)]">
            {fmt(fundPt.value)}
          </span>
        </div>
      )}
      {showBench && benchPt && benchPt.value != null && mode === "price" && (
        <div className="flex items-center justify-between gap-4 mt-0.5">
          <span className="flex items-center gap-1.5 text-[var(--fg-secondary)]">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--fg-tertiary)]" />
            ACWI IMI
          </span>
          <span className="font-medium num text-[var(--fg-secondary)]">
            ${fmtMoneyC(benchPt.value)}
          </span>
        </div>
      )}
    </div>
  );
}

type ChartRow = { t: number; price: number | null; bench: number | null };

/** True if this TF has enough real history to be meaningful. */
function tfAvailable(
  tf: TF,
  bars: Bar[],
  hasIntraday: boolean,
  ytdBarCount: number
): boolean {
  if (tf === "1D") return hasIntraday;
  if (tf === "YTD") return ytdBarCount >= TF_MIN_BARS.YTD;
  return bars.length >= TF_MIN_BARS[tf];
}

export function PriceChart() {
  const { PRICE, SERIES, BENCHMARK, DRAWDOWN, ROLLING30, CAGE_BARS } =
    useDataset();

  // Which timeframes have enough underlying data to render.
  const availability = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const ytdBars = CAGE_BARS.filter(
      (b) => new Date(b.t).getFullYear() === thisYear
    ).length;
    const hasIntraday = (SERIES["1D"]?.length ?? 0) >= 2;
    return Object.fromEntries(
      TF_ORDER.map((tf) => [
        tf,
        tfAvailable(tf, CAGE_BARS, hasIntraday, ytdBars),
      ])
    ) as Record<TF, boolean>;
  }, [CAGE_BARS, SERIES]);

  const anyAvailable = TF_ORDER.some((tf) => availability[tf]);

  // Pick the longest TF that's actually available — biased toward more
  // history when we have it, drops down to 1D / nothing when we don't.
  const defaultTF: TF | null = useMemo(() => {
    const preference: TF[] = ["1Y", "ALL", "YTD", "3M", "1M", "1W", "1D"];
    return preference.find((tf) => availability[tf]) ?? null;
  }, [availability]);

  const [tf, setTf] = useState<TF>(defaultTF ?? "1M");

  // If the currently-selected TF becomes unavailable (e.g. data changed),
  // snap back to whatever the best available is.
  useEffect(() => {
    if (!availability[tf] && defaultTF) setTf(defaultTF);
  }, [availability, tf, defaultTF]);

  const [showBench, setShowBench] = useState(false);
  const [mode, setMode] = useState<Mode>("price");

  const data: ChartRow[] = useMemo(() => {
    if (mode === "price") {
      const series = SERIES[tf];
      const bench = BENCHMARK[tf];
      if (!series || series.length === 0) return [];
      const fundStart = series[0].price;
      const benchStart = bench?.[0]?.price;
      const scale = benchStart ? fundStart / benchStart : 1;
      return series.map((pt, i) => ({
        t: pt.t,
        price: pt.price,
        bench: bench?.[i] ? +(bench[i].price * scale).toFixed(4) : null,
      }));
    }
    if (mode === "drawdown") {
      const tfKey: TF = tf === "1D" || tf === "1W" ? "1M" : tf;
      const series = DRAWDOWN[tfKey] || DRAWDOWN["3M"];
      if (!series || series.length === 0) return [];
      return series.map((pt: SeriesPoint) => ({
        t: pt.t,
        price: pt.price,
        bench: null,
      }));
    }
    if (mode === "rolling") {
      const tfKey: TF =
        tf === "1D" || tf === "1W" || tf === "1M" ? "3M" : tf;
      const series = ROLLING30[tfKey] || ROLLING30["3M"];
      if (!series) return [];
      return series
        .filter((p) => p.price != null)
        .map((pt) => ({ t: pt.t, price: pt.price, bench: null }));
    }
    return [];
  }, [tf, mode, SERIES, BENCHMARK, DRAWDOWN, ROLLING30]);

  const prev = PRICE.prevClose;
  const isGain = PRICE.dayChange >= 0;
  const accent =
    mode === "price"
      ? isGain
        ? "var(--gain)"
        : "var(--loss)"
      : mode === "drawdown"
      ? "var(--loss)"
      : "var(--accent)";

  const yDomain = useMemo<[number, number] | [string, string]>(() => {
    if (!data.length) return ["auto", "auto"];
    const all = data
      .flatMap((d) => [d.price, d.bench])
      .filter((v): v is number => v != null);
    if (!all.length) return ["auto", "auto"];
    const mn = Math.min(...all);
    const mx = Math.max(...all);
    if (mode === "drawdown") {
      return [Math.min(mn * 1.15, -0.5), 0.5];
    }
    if (mode === "rolling") {
      const m = Math.max(Math.abs(mn), Math.abs(mx)) * 1.15;
      return [-m, m];
    }
    const pad = (mx - mn) * 0.12 || 0.5;
    return [mn - pad, mx + pad];
  }, [data, mode]);

  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [tf, mode]);

  const yFmt = mode === "price" ? axisFormatPrice : axisFormatPct;
  const zeroLine = mode !== "price";

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-0 border-b border-[var(--border)] -mb-px">
          {MODES.map((m) => (
            <ModeTab
              key={m.id}
              active={m.id === mode}
              onClick={() => setMode(m.id)}
              hint={m.desc}
            >
              {m.label}
            </ModeTab>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-0.5">
            {TF_ORDER.map((k) => {
              const enabled = availability[k];
              return (
                <TFPill
                  key={k}
                  active={k === tf}
                  disabled={!enabled}
                  title={
                    enabled ? undefined : `Not enough history yet for ${k}`
                  }
                  onClick={() => enabled && setTf(k)}
                >
                  {k}
                </TFPill>
              );
            })}
          </div>
          {mode === "price" && (
            <button
              onClick={() => setShowBench((v) => !v)}
              className={
                "flex items-center gap-1.5 px-2.5 h-8 text-[11.5px] font-medium rounded-md border transition-colors " +
                (showBench
                  ? "bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--fg)]"
                  : "bg-transparent border-[var(--border)] text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]")
              }
              title="Overlay MSCI ACWI IMI benchmark"
            >
              <span className="inline-block w-3 h-[2px] bg-[var(--fg-tertiary)]" />
              ACWI&nbsp;IMI
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-[var(--fg-tertiary)] mb-2 h-4">
        {MODES.find((m) => m.id === mode)?.desc}
      </div>

      {!anyAvailable || data.length === 0 ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-center px-6">
          <div className="text-[13px] text-[var(--fg-secondary)] font-medium">
            No price history yet
          </div>
          <div className="text-[12px] text-[var(--fg-tertiary)] mt-1 max-w-[360px]">
            CAGE launched on{" "}
            {new Date("2026-03-18").toLocaleDateString("en-CA", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            . Yahoo hasn&apos;t published daily bars for this ticker yet — the
            chart will fill in as data becomes available.
          </div>
        </div>
      ) : (
        <div className="h-[300px] -ml-3" key={animKey}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                tickFormatter={(v: number) => axisTickFormatter(v, tf)}
                stroke="var(--fg-tertiary)"
                tick={{ fontSize: 11, fill: "var(--fg-tertiary)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={36}
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
              />
              <YAxis
                domain={yDomain}
                orientation="right"
                tickFormatter={yFmt}
                stroke="var(--fg-tertiary)"
                tick={{ fontSize: 11, fill: "var(--fg-tertiary)" }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                content={
                  <ChartTooltip tf={tf} showBench={showBench} mode={mode} />
                }
                cursor={{
                  stroke: "var(--fg-tertiary)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              {mode === "price" && tf === "1D" && prev > 0 && (
                <ReferenceLine
                  y={prev}
                  stroke="var(--fg-tertiary)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                  label={{
                    value: `Prev close $${fmtMoneyC(prev)}`,
                    position: "insideTopLeft",
                    fill: "var(--fg-tertiary)",
                    fontSize: 10,
                  }}
                />
              )}
              {zeroLine && (
                <ReferenceLine
                  y={0}
                  stroke="var(--border-strong)"
                  strokeWidth={1}
                />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={accent}
                strokeWidth={1.75}
                fill="url(#cageFill)"
                isAnimationActive
                animationDuration={620}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: accent,
                  stroke: "var(--bg)",
                  strokeWidth: 2,
                }}
                connectNulls
              />
              {showBench && mode === "price" && (
                <Line
                  type="monotone"
                  dataKey="bench"
                  stroke="var(--fg-tertiary)"
                  strokeWidth={1.25}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive
                  animationDuration={550}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
