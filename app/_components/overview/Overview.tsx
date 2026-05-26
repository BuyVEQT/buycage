"use client";

import { useEffect, useState } from "react";
import { useDataset } from "./dataset";
import { IconArrowDown, IconArrowUp } from "./icons";
import { AnimatedNumber, Reveal, Sparkline } from "./shared";
import { AnomalyRow } from "./AnomalyRow";
import { TodaysBrief } from "./TodaysBrief";
import { SinceLastVisit } from "./SinceLastVisit";
import { PriceChart } from "./PriceChart";
import { ChartVitals } from "./ChartVitals";
import { DayVitals } from "./DayVitals";
import { Leaderboard } from "./Leaderboard";
import { TeaserStrip } from "./TeaserStrip";
import { Header, useScrollY } from "./Header";
import { Footer } from "./Footer";

function Hero() {
  const { CAGE_META, PRICE, SERIES } = useDataset();
  const isGain = PRICE.dayChange >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";

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

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-8 gap-y-3 items-end">
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

        <div className="hidden md:flex items-center gap-6 text-[11.5px] text-[var(--fg-tertiary)] num border-l border-[var(--border)] pl-6 self-center">
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">Prev close</span>
            <span className="text-[var(--fg)] text-[13px]">
              ${PRICE.prevClose.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">Open</span>
            <span className="text-[var(--fg)] text-[13px]">
              ${PRICE.open.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">Volume</span>
            <span className="text-[var(--fg)] text-[13px]">
              {(PRICE.volume / 1000).toFixed(1)}K
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">AUM</span>
            <span className="text-[var(--fg)] text-[13px]">
              ${(PRICE.aum / 1e6).toFixed(1)}M
            </span>
          </div>
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
        <SinceLastVisit />
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
