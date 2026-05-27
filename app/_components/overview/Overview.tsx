"use client";

import Link from "next/link";
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

function HeroFact({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0 border-l border-[var(--border)] pl-3">
      <span className="h-eyebrow">{label}</span>
      <span className="mt-1 block font-serif text-[22px] leading-none text-[var(--fg)] num">
        {value}
      </span>
      {detail && (
        <span className="mt-1 block text-[11px] text-[var(--fg-tertiary)] leading-tight">
          {detail}
        </span>
      )}
    </div>
  );
}

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
        className="font-serif text-[20px] leading-none num"
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

  const streakDir = STREAKS.current.dir;
  const streakCount = STREAKS.current.count;
  const streakColor =
    streakDir > 0
      ? "var(--gain)"
      : streakDir < 0
      ? "var(--loss)"
      : "var(--fg)";
  const streakValue = streakCount > 0 ? streakCount : "-";
  const streakSub =
    streakCount > 0
      ? `${streakDir > 0 ? "up" : "down"} day${
          streakCount === 1 ? "" : "s"
        } running`
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

  const statItems = [
    {
      label: "Streak",
      value: streakValue,
      sub: streakSub,
      color: streakColor,
    },
    {
      label: "Volume",
      value: volRatio > 0 ? `${volRatio.toFixed(2)}x` : "-",
      sub: "vs 20-day avg",
      color: volColor,
    },
    {
      label: "Since inception",
      value:
        siReturn !== 0
          ? `${siReturn > 0 ? "+" : ""}${siReturn.toFixed(1)}%`
          : "-",
      sub: "Mar 18, 2026",
      color: siColor,
    },
    {
      label: "52-wk position",
      value: w52Range > 0 ? `${w52Pos.toFixed(0)}%` : "-",
      sub:
        w52Range > 0
          ? w52Pos > 75
            ? "near high"
            : w52Pos < 25
            ? "near low"
            : "mid-range"
          : "",
    },
  ];

  const positioningItems = [
    ["Default giants", "VEQT / XEQT"],
    ["CAGE angle", "Five Avantis sleeves"],
    ["BuyCage lens", "Price, weights, daily read"],
  ];

  return (
    <section className="pt-10 sm:pt-14 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-8 lg:gap-10 items-end">
        <div>
          <div className="flex items-center gap-3 text-[12px] flex-wrap">
            <span className="font-mono tracking-wide text-[var(--fg-tertiary)] uppercase">
              {CAGE_META.exchange}:{CAGE_META.ticker}
            </span>
            <span className="h-3 w-px bg-[var(--border-strong)]" />
            <span className="text-[var(--fg-tertiary)]">
              {CAGE_META.currency}
            </span>
            <span className="h-3 w-px bg-[var(--border-strong)]" />
            <span className="text-[var(--fg-tertiary)]">
              {(CAGE_META.mer * 100).toFixed(2)}% MER
            </span>
          </div>

          <h1 className="mt-5 max-w-[760px] font-serif text-[46px] sm:text-[64px] lg:text-[76px] leading-[0.96] text-[var(--fg)]">
            CAGE, in context.
          </h1>
          <p className="mt-4 max-w-[560px] text-[16px] sm:text-[18px] leading-7 text-[var(--fg-secondary)]">
            A cleaner read on the Avantis CIBC all-equity ETF: what moved,
            what matters, and where the sleeves are doing the work.
          </p>

          <div className="mt-5 max-w-[700px] rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/75 p-2 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {positioningItems.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md bg-[var(--bg)] px-3 py-2.5"
                >
                  <div className="h-eyebrow">{label}</div>
                  <div className="mt-1 font-serif text-[19px] leading-none text-[var(--fg)]">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/why"
              className="inline-flex h-10 items-center rounded-md bg-[var(--fg)] px-4 text-[13px] font-medium text-[var(--bg)] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Why CAGE
            </Link>
            <Link
              href="/inside"
              className="inline-flex h-10 items-center rounded-md border border-[var(--border-strong)] px-4 text-[13px] font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              See holdings
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <HeroFact label="Ticker" value="CAGE" detail="Canadian-listed" />
            <HeroFact label="Posture" value="100%" detail="equity allocation" />
            <HeroFact label="Sleeves" value="5" detail="regional building blocks" />
            <HeroFact label="Benchmark" value="ACWI" detail="IMI reference" />
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="h-eyebrow">Live snapshot</span>
              <div className="mt-1 text-[12px] text-[var(--fg-tertiary)]">
                {CAGE_META.name}
              </div>
            </div>
            <Sparkline
              data={SERIES["1D"]}
              color={color}
              width={108}
              height={32}
            />
          </div>

          <div className="mt-5 flex items-end gap-2 flex-wrap">
            <span className="text-[var(--fg-tertiary)] text-[24px] leading-none font-serif">
              $
            </span>
            <span className="font-serif text-[60px] sm:text-[70px] leading-none text-[var(--fg)] num">
              <AnimatedNumber value={PRICE.current} decimals={2} duration={800} />
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 h-7 rounded-md num text-[13px] font-medium mb-2"
              style={{
                color,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
              }}
            >
              {isGain ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />}
              <span>
                {isGain ? "+" : ""}${Math.abs(PRICE.dayChange).toFixed(2)}
              </span>
              <span className="opacity-60">/</span>
              <span>
                {isGain ? "+" : ""}
                {PRICE.dayChangePct.toFixed(2)}%
              </span>
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {statItems.map((item) => (
              <HeroStat key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AnomalyRow />
      </div>
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

        <Reveal>
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            <div className="card card-pad min-w-0 flex flex-col">
              <PriceChart />
              <ChartVitals />
            </div>
            <DayVitals />
          </section>
        </Reveal>

        <TodaysBrief />

        <Reveal>
          <Leaderboard />
        </Reveal>

        <Reveal>
          <TeaserStrip />
        </Reveal>

        <Footer />
      </main>
    </div>
  );
}
