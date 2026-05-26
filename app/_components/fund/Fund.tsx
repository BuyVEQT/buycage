"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "../overview/Footer";
import { Header, useScrollY } from "../overview/Header";
import { useDataset } from "../overview/dataset";
import { IconArrowDown, IconArrowUp } from "../overview/icons";
import { FundChart } from "./FundChart";

function fmtPct(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function fmtPP(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)} pp`;
}

function shortName(name: string): string {
  return name
    .replace("Avantis CIBC ", "")
    .replace(" ETF", "")
    .trim();
}

export function Fund({ ticker }: { ticker: string }) {
  const dataset = useDataset();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollY = useScrollY();
  const compressed = scrollY > 60;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const sibling = dataset.SIBLINGS.find((s) => s.ticker === ticker);
  const bars = dataset.SIBLING_BARS[ticker] ?? [];

  if (!sibling) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <Header
          theme={theme}
          setTheme={setTheme}
          compressed={compressed}
          active="fund"
        />
        <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-20">
          <p className="text-[var(--fg-tertiary)]">Fund not found.</p>
        </main>
      </div>
    );
  }

  const isGain = sibling.dayChangePct >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const currentPrice = last?.close ?? 0;
  const prevClose = prev?.close ?? 0;
  const dayDollarChange = currentPrice - prevClose;

  // Yahoo doesn't expose 52w range cleanly per sibling here, derive from bars.
  const w52Low = bars.length ? Math.min(...bars.map((b) => b.low)) : 0;
  const w52High = bars.length ? Math.max(...bars.map((b) => b.high)) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Header
        theme={theme}
        setTheme={setTheme}
        compressed={compressed}
        active="fund"
      />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors mb-6"
        >
          <span aria-hidden>←</span>
          Back to CAGE overview
        </Link>

        {/* Hero */}
        <section className="mb-8">
          <div className="flex items-center gap-3 text-[12px] flex-wrap mb-4">
            <span className="font-mono tracking-wide text-[var(--fg-tertiary)] uppercase">
              NEO:{sibling.ticker}
            </span>
            <span className="h-3 w-px bg-[var(--border-strong)]" />
            <span className="text-[var(--fg-tertiary)]">CAD</span>
            <span className="h-3 w-px bg-[var(--border-strong)]" />
            <span className="text-[var(--fg-tertiary)]">
              {sibling.weight * 100}% of CAGE
            </span>
          </div>

          <h1
            className="font-serif text-[var(--fg)] tracking-tight leading-[1.05] mb-3"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.02em" }}
          >
            {shortName(sibling.name)}
          </h1>
          <p className="text-[13px] text-[var(--fg-tertiary)] mb-6">
            {sibling.name}
          </p>

          {currentPrice > 0 ? (
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[var(--fg-tertiary)] text-[22px] leading-none font-serif">
                $
              </span>
              <span
                className="font-serif text-[var(--fg)] tracking-tight leading-none num"
                style={{
                  fontSize: "clamp(40px, 5vw, 60px)",
                  letterSpacing: "-0.02em",
                }}
              >
                {currentPrice.toFixed(2)}
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
                  {isGain ? "+" : ""}${Math.abs(dayDollarChange).toFixed(2)}
                </span>
                <span className="opacity-60">·</span>
                <span>{fmtPct(sibling.dayChangePct)}</span>
              </span>
            </div>
          ) : (
            <p className="text-[var(--fg-tertiary)] text-[14px]">
              Live quote unavailable.
            </p>
          )}
        </section>

        {/* Chart + sleeve stats */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          <div className="card card-pad min-w-0">
            <FundChart
              bars={bars}
              ticker={sibling.ticker}
              isGain={isGain}
            />
          </div>

          <aside className="card card-pad flex flex-col gap-5">
            <header>
              <div className="h-eyebrow mb-1">In CAGE</div>
              <h3 className="h-title">Sleeve role</h3>
            </header>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="h-eyebrow mb-1">Weight</div>
                <div className="font-serif text-[28px] num leading-none text-[var(--fg)]">
                  {(sibling.weight * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="h-eyebrow mb-1">Today&apos;s contrib.</div>
                <div
                  className="font-serif text-[28px] num leading-none"
                  style={{ color }}
                >
                  {fmtPP(sibling.contribution)}
                </div>
              </div>
            </div>

            {bars.length > 0 && (
              <div className="border-t border-[var(--border)] pt-4 grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <div className="h-eyebrow mb-1">Range (window)</div>
                  <div className="num text-[var(--fg)]">
                    ${w52Low.toFixed(2)}
                    <span className="text-[var(--fg-tertiary)] mx-1">–</span>$
                    {w52High.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="h-eyebrow mb-1">Bars available</div>
                  <div className="num text-[var(--fg)]">
                    {bars.length}{" "}
                    <span className="text-[var(--fg-tertiary)]">days</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11.5px] text-[var(--fg-tertiary)] leading-relaxed border-t border-[var(--border)] pt-4">
              {sibling.weight * 100}% of every CAGE dollar flows into{" "}
              {sibling.ticker}. Day-to-day, {sibling.ticker}&apos;s move ×
              this weight = its contribution to CAGE&apos;s daily return.
            </p>
          </aside>
        </section>

        {/* Top holdings */}
        <section className="mt-10">
          <header className="flex items-end justify-between mb-4 gap-4">
            <div>
              <div className="h-eyebrow mb-1">Holdings</div>
              <h2 className="h-title">Top 10 in {sibling.ticker}</h2>
              <p className="text-[13px] text-[var(--fg-tertiary)] mt-1">
                Weights shown are within {sibling.ticker} (not effective in
                CAGE). Multiply each by {(sibling.weight * 100).toFixed(1)}%
                for the effective weight in CAGE.
              </p>
            </div>
          </header>

          <div className="card overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="h-eyebrow">
                  <th className="text-left font-normal px-4 py-3 w-[40px]">
                    #
                  </th>
                  <th className="text-left font-normal px-4 py-3">Name</th>
                  <th className="text-left font-normal px-4 py-3 w-[80px]">
                    Ticker
                  </th>
                  <th className="text-left font-normal px-4 py-3 w-[140px]">
                    Sector
                  </th>
                  <th className="text-right font-normal px-4 py-3 w-[100px]">
                    Weight
                  </th>
                  <th className="text-right font-normal px-4 py-3 w-[120px]">
                    Effective
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sibling.holdings.map((h, i) => (
                  <tr key={h.name}>
                    <td className="px-4 py-3 text-[var(--fg-tertiary)] num">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 text-[var(--fg)]">{h.name}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-secondary)]">
                      {h.ticker}
                    </td>
                    <td className="px-4 py-3 text-[var(--fg-tertiary)]">
                      {h.sector}
                    </td>
                    <td className="px-4 py-3 text-right num text-[var(--fg)]">
                      {(h.weight * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right num text-[var(--fg-secondary)]">
                      {(h.weight * sibling.weight * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
