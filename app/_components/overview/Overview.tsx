"use client";

import { useEffect, useState } from "react";
import { useDataset } from "./dataset";
import { IconArrowDown, IconArrowUp } from "./icons";
import { AnimatedNumber, Reveal, Sparkline } from "./shared";
import { AnomalyRow } from "./AnomalyRow";
import { TodaysBrief } from "./TodaysBrief";
import { PriceChart } from "./PriceChart";
import { ChartVitals } from "./ChartVitals";
import { DayVitals } from "./DayVitals";
import { Leaderboard } from "./Leaderboard";
import { TeaserStrip } from "./TeaserStrip";
import { Header, useScrollY } from "./Header";
import { Footer } from "./Footer";

/** Single stat tile in the hero context strip. */
function HeroStat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="h-eyebrow">{label}</span>
      <span
        className="font-serif text-[20px] leading-none num tracking-tight"
        style={{ color: color ?? "var(--fg)" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10.5px] text-[var(--fg-tertiary)] leading-none">
          {sub}
        </span>
      )}
    </div>
  );
}

function Hero() {
  const { CAGE_META, PRICE, SERIES, STREAKS, RETURNS } = useDataset();
  const isGain = PRICE.dayChange >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";

  // Contextual stats — these actually change day-to-day, unlike the old
  // prev-close / open / volume / AUM strip which mostly stayed static.
  const streakDir = STREAKS.current.dir;
  const streakCount = STREAKS.current.count;
  const streakColor =
    streakDir > 0
      ? "var(--gain)"
      : streakDir < 0
      ? "var(--loss)"
      : "var(--fg)";
  const streakValue = streakCount > 0 ? streakCount : "—";
  const streakSub =
    streakCount > 0
      ? `${streakDir > 0 ? "up" : "down"} day${streakCount === 1 ? "" : "s"} running`
      : "no streak";

  const volRatio =
    PRICE.avgVolume20d > 0 ? PRICE.volume / PRICE.avgVolume20d : 0;
  const volColor =
    volRatio >= 1.5
      ? "var(--fg)"
      : volRatio <= 0.6
      ? "var(--fg-tertiary)"
      : "var(--fg)";

  const siReturn = RETURNS.fund.SI ?? 0;
  const siColor =
    siReturn > 0 ? "var(--gain)" : siReturn < 0 ? "var(--loss)" : "var(--fg)";

  const w52Range = PRICE.week52Range[1] - PRICE.week52Range[0];
  const w52Pos =
    w52Range > 0
      ? ((PRICE.current - PRICE.week52Range[0]) / w52Range) * 100
      : 0;

  return (
    <section className="pt-10 pb-2">
      <div className="flex items-center gap-3 text-[12px] flex-wrap">
        <span className="font-mono tracking-wide text-[var(--fg-tertiary)] uppercase">
          {CAGE_META.exchange}:{CAGE_META.ticker}
        </span>
        <span className="h-3 w-px bg-[var(--border-strong)]" />
        <span className="text-[var(--fg-tertiary)]">{CAGE_META.currency}</span>
        <span className="h-3 w-px bg-[var(--border-strong)]" />
        <span className="text-[var(--fg-tertiary)] truncate max-w-[420px]">
          {CAGE_META.name}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-8 gap-y-4 items-end">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[var(--fg-tertiary)] text-[28px] leading-none font-serif">
            $
          </span>
          <span
            className="font-serif text-[var(--fg)] tracking-tight leading-none num"
            style={{
              fontSize: "clamp(56px, 7vw, 88px)",
              letterSpacing: "-0.02em",
            }}
          >
            <AnimatedNumber value={PRICE.current} decimals={2} duration={800} />
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 h-7 rounded-md num text-[13px] font-medium ml-2 self-center"
            style={{
              color,
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
            }}
          >
            {isGain ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />}
            <span>
              {isGain ? "+" : ""}${Math.abs(PRICE.dayChange).toFixed(2)}
            </span>
            <span className="opacity-60">·</span>
            <span>
              {isGain ? "+" : ""}
              {PRICE.dayChangePct.toFixed(2)}%
            </span>
          </span>
        </div>

        {/* Contextual stats strip — what's interesting today, not boring statics */}
        <div className="hidden md:flex items-end gap-8 border-l border-[var(--border)] pl-6 self-stretch py-2">
          <HeroStat
            label="Streak"
            value={streakValue}
            sub={streakSub}
            color={streakColor}
          />
          <HeroStat
            label="Volume"
            value={volRatio > 0 ? `${volRatio.toFixed(2)}×` : "—"}
            sub="vs 20-day avg"
            color={volColor}
          />
          <HeroStat
            label="Since inception"
            value={
              siReturn !== 0
                ? `${siReturn > 0 ? "+" : ""}${siReturn.toFixed(1)}%`
                : "—"
            }
            sub="Mar 18, 2026"
            color={siColor}
          />
          <HeroStat
            label="52-wk position"
            value={w52Range > 0 ? `${w52Pos.toFixed(0)}%` : "—"}
            sub={
              w52Range > 0
                ? w52Pos > 75
                  ? "near high"
                  : w52Pos < 25
                  ? "near low"
                  : "mid-range"
                : ""
            }
          />
        </div>

        <div className="flex items-end justify-end gap-2 self-center">
          <Sparkline
            data={SERIES["1D"]}
            color={color}
            width={132}
            height={36}
          />
        </div>
      </div>

      <AnomalyRow />
    </section>
  );
}

export function Overview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollY = useScrollY();
  const compressed = scrollY > 60;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Header
        theme={theme}
        setTheme={setTheme}
        compressed={compressed}
        active="overview"
      />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Hero />

        {/* Chart + day vitals (chart card now bundles its own compact vitals strip) */}
        <Reveal>
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            <div className="card card-pad min-w-0 flex flex-col">
              <PriceChart />
              <ChartVitals />
            </div>
            <DayVitals />
          </section>
        </Reveal>

        {/* Brief — repositioned below the chart, smaller text */}
        <TodaysBrief />

        {/* Leader + ranked siblings */}
        <Reveal>
          <Leaderboard />
        </Reveal>

        {/* Teaser → /inside */}
        <Reveal>
          <TeaserStrip />
        </Reveal>

        <Footer />
      </main>
    </div>
  );
}
