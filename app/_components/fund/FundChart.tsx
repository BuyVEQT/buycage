"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bar } from "../overview/data";

// Slim version of the Overview PriceChart, scoped to a single sibling
// fund. No mode tabs, no benchmark overlay — just price + timeframes,
// with pills auto-greying when not enough bars exist.

const TF_ORDER = ["1W", "1M", "3M", "YTD", "1Y", "ALL"] as const;
type TF = (typeof TF_ORDER)[number];
const TF_MIN_BARS: Record<TF, number> = {
  "1W": 5,
  "1M": 22,
  "3M": 63,
  YTD: 1,
  "1Y": 252,
  ALL: 1,
};

function fmtMoney(n: number, digits = 2) {
  return n.toLocaleString("en-CA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function tooltipDate(t: number) {
  return new Date(t).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function axisTickFormatter(t: number) {
  return new Date(t).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
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

function ChartTooltip({
  active,
  payload,
  label,
  ticker,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: number;
  ticker: string;
}) {
  if (!active || !payload?.length || label == null) return null;
  const pt = payload[0];
  if (pt.value == null) return null;
  return (
    <div className="card card-pad py-2 px-3 text-[12px] min-w-[140px] shadow-xl">
      <div className="text-[var(--fg-tertiary)] mb-1 num">
        {tooltipDate(label)}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[var(--fg-secondary)]">{ticker}</span>
        <span className="font-medium num text-[var(--fg)]">
          ${fmtMoney(pt.value)}
        </span>
      </div>
    </div>
  );
}

function sliceBars(bars: Bar[], tf: TF): Bar[] {
  if (tf === "1W") return bars.slice(-5);
  if (tf === "1M") return bars.slice(-22);
  if (tf === "3M") return bars.slice(-63);
  if (tf === "YTD") {
    const y = new Date().getFullYear();
    return bars.filter((b) => new Date(b.t).getFullYear() === y);
  }
  return bars; // 1Y / ALL
}

export function FundChart({
  bars,
  ticker,
  isGain,
}: {
  bars: Bar[];
  ticker: string;
  isGain: boolean;
}) {
  const accent = isGain ? "var(--gain)" : "var(--loss)";

  const availability = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const ytd = bars.filter(
      (b) => new Date(b.t).getFullYear() === thisYear
    ).length;
    return Object.fromEntries(
      TF_ORDER.map((tf) => [
        tf,
        tf === "YTD" ? ytd >= TF_MIN_BARS.YTD : bars.length >= TF_MIN_BARS[tf],
      ])
    ) as Record<TF, boolean>;
  }, [bars]);

  const defaultTF: TF | null = useMemo(() => {
    const pref: TF[] = ["1Y", "ALL", "YTD", "3M", "1M", "1W"];
    return pref.find((tf) => availability[tf]) ?? null;
  }, [availability]);

  const [tf, setTf] = useState<TF>(defaultTF ?? "1M");
  useEffect(() => {
    if (availability[tf] || !defaultTF) return;
    const id = window.setTimeout(() => setTf(defaultTF), 0);
    return () => window.clearTimeout(id);
  }, [availability, tf, defaultTF]);

  const data = useMemo(() => {
    return sliceBars(bars, tf).map((b) => ({ t: b.t, price: b.close }));
  }, [bars, tf]);

  const yDomain = useMemo<[number, number] | [string, string]>(() => {
    if (!data.length) return ["auto", "auto"];
    const ys = data.map((d) => d.price);
    const mn = Math.min(...ys);
    const mx = Math.max(...ys);
    const pad = (mx - mn) * 0.12 || 0.5;
    return [mn - pad, mx + pad];
  }, [data]);

  const anyAvailable = TF_ORDER.some((tf) => availability[tf]);

  return (
    <section>
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-0.5">
          {TF_ORDER.map((k) => (
            <TFPill
              key={k}
              active={k === tf}
              disabled={!availability[k]}
              title={availability[k] ? undefined : `Not enough history for ${k}`}
              onClick={() => availability[k] && setTf(k)}
            >
              {k}
            </TFPill>
          ))}
        </div>
      </div>

      {!anyAvailable || data.length === 0 ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-center px-6">
          <div className="text-[13px] text-[var(--fg-secondary)] font-medium">
            No price history yet
          </div>
          <div className="text-[12px] text-[var(--fg-tertiary)] mt-1 max-w-[360px]">
            Yahoo hasn&apos;t published daily bars for {ticker} yet — the
            chart will fill in as data becomes available.
          </div>
        </div>
      ) : (
        <div className="h-[280px] -ml-3" key={tf}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`fund-${ticker}-fill`} x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(v: number) => axisTickFormatter(v)}
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
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                stroke="var(--fg-tertiary)"
                tick={{ fontSize: 11, fill: "var(--fg-tertiary)" }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                content={<ChartTooltip ticker={ticker} />}
                cursor={{
                  stroke: "var(--fg-tertiary)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={accent}
                strokeWidth={1.75}
                fill={`url(#fund-${ticker}-fill)`}
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
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
