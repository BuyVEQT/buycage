"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Sibling, Bar } from "./data";
import { useDataset } from "./dataset";
import { Sparkline } from "./shared";

// Hover treatment shared by the Leader and Ranked cards. Subtle border
// brighten + lift, with a focus ring for keyboard users.
const HOVER_CARD =
  "block hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

function fmtPct(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}
function fmtPP(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)} pp`;
}

function shortName(s: Sibling): string {
  // "Avantis CIBC US Equity ETF" → "US Equity"
  return s.name
    .replace("Avantis CIBC ", "")
    .replace(" ETF", "")
    .trim();
}

function sparkSeries(ticker: string, siblingBars: Record<string, Bar[]>) {
  return siblingBars[ticker].slice(-30).map((b) => ({
    t: b.t,
    price: b.close,
  }));
}

function buildSentence(sorted: Sibling[], siblings: Sibling[]): string {
  const leader = sorted[0];
  const upCount = siblings.filter((s) => s.dayChangePct > 0).length;
  const downCount = siblings.filter((s) => s.dayChangePct < 0).length;
  const leadName = shortName(leader);
  const verb = leader.contribution >= 0 ? "carried" : "weighed on";
  let rhythm: string;
  if (downCount === 0) rhythm = "All five sleeves moved together.";
  else if (upCount === siblings.length) rhythm = "Every sleeve participated.";
  else if (downCount === 1)
    rhythm = `Four of five sleeves moved with it; one held back.`;
  else
    rhythm = `${upCount} of ${siblings.length} sleeves moved with the tape.`;
  return `${leadName} ${verb} today · ${fmtPP(
    leader.contribution
  )} of contribution. ${rhythm}`;
}

function LeaderCard({
  s,
  siblingBars,
  sibPalette,
}: {
  s: Sibling;
  siblingBars: Record<string, Bar[]>;
  sibPalette: Record<string, string>;
}) {
  const isGain = s.dayChangePct >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";
  const swatch = sibPalette[s.color];
  return (
    <Link
      href="/inside"
      className={`card card-pad relative flex flex-col min-h-[280px] ${HOVER_CARD}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: swatch }}
          />
          Leader
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-tertiary)] font-mono">
          {s.ticker.replace(".NE", "")} · Weight {(s.weight * 100).toFixed(1)}%
        </span>
      </div>

      {/* Name */}
      <div
        className="font-serif text-[var(--fg)] tracking-tight mt-4 leading-[1]"
        style={{ fontSize: "clamp(34px, 4vw, 48px)", letterSpacing: "-0.02em" }}
      >
        {shortName(s)}
      </div>

      {/* % change + contribution */}
      <div className="flex items-end gap-8 mt-5">
        <div
          className="font-serif num tracking-tight leading-none"
          style={{
            color,
            fontSize: "clamp(40px, 4.6vw, 56px)",
            letterSpacing: "-0.02em",
          }}
        >
          {isGain ? "+" : ""}
          {s.dayChangePct.toFixed(2)}
          <span style={{ fontSize: "0.55em" }}>%</span>
        </div>
        <div className="pb-1">
          <div className="h-eyebrow mb-1">Contribution</div>
          <div
            className="font-serif num leading-none"
            style={{ color, fontSize: "26px" }}
          >
            {fmtPP(s.contribution)}
          </div>
          <div className="text-[11px] text-[var(--fg-tertiary)] mt-1.5 italic">
            in today&apos;s move
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-auto pt-5">
        <div className="relative h-[68px] w-full overflow-hidden">
          <Sparkline
            data={sparkSeries(s.ticker, siblingBars)}
            color={color}
            width={520}
            height={68}
            strokeWidth={1.5}
            fill
            responsive
          />
        </div>
        <div className="text-[10px] text-[var(--fg-tertiary)] italic mt-1">
          30 trading days
        </div>
      </div>
    </Link>
  );
}

function RankedCard({
  s,
  rank,
  siblingBars,
}: {
  s: Sibling;
  rank: number;
  siblingBars: Record<string, Bar[]>;
}) {
  const isGain = s.dayChangePct >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";
  return (
    <Link
      href="/inside"
      className={`card flex items-center gap-4 px-4 py-3.5 ${HOVER_CARD}`}
    >
      {/* Rank + identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="font-serif text-[var(--fg-tertiary)] num leading-none"
          style={{ fontSize: 24 }}
        >
          {rank}
        </span>
        <div className="min-w-0">
          <div
            className="font-serif text-[var(--fg)] italic leading-tight"
            style={{ fontSize: 18, letterSpacing: "-0.01em" }}
          >
            {shortName(s)}
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-tertiary)] font-mono mt-0.5">
            {s.ticker.replace(".NE", "")} · {(s.weight * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="hidden sm:block shrink-0">
        <Sparkline
          data={sparkSeries(s.ticker, siblingBars)}
          color={color}
          width={108}
          height={32}
          strokeWidth={1.25}
          fill
        />
      </div>

      {/* % + contribution */}
      <div className="text-right shrink-0 min-w-[88px]">
        <div
          className="font-serif num leading-none"
          style={{ color, fontSize: 22, letterSpacing: "-0.01em" }}
        >
          {isGain ? "+" : ""}
          {s.dayChangePct.toFixed(2)}
          <span style={{ fontSize: "0.6em" }}>%</span>
        </div>
        <div
          className="text-[11px] num mt-1.5"
          style={{ color }}
        >
          {fmtPP(s.contribution)}
        </div>
      </div>
    </Link>
  );
}

export function Leaderboard() {
  const { PRICE, SIBLINGS, SIBLING_BARS, SIB_PALETTE } = useDataset();
  const sorted = useMemo(
    () =>
      [...SIBLINGS].sort(
        (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
      ),
    [SIBLINGS]
  );
  const cageMove = PRICE.dayChangePct;
  const sentence = buildSentence(sorted, SIBLINGS);
  const leader = sorted[0];
  const ranked = sorted.slice(1);

  return (
    <section className="mt-12">
      {/* Header: in-a-sentence row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="pill" data-tone="muted">
          In a sentence
        </span>
        <span
          className="font-serif italic text-[var(--fg-secondary)] tracking-tight"
          style={{ fontSize: "clamp(14px, 1.4vw, 17px)" }}
        >
          {sentence}
        </span>
        <span
          className={
            "ml-auto text-[12px] num font-medium " +
            (cageMove >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]")
          }
        >
          CAGE {fmtPct(cageMove)}
        </span>
      </div>

      {/* Leader + ranked grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
        <LeaderCard s={leader} siblingBars={SIBLING_BARS} sibPalette={SIB_PALETTE} />
        <div className="flex flex-col gap-3">
          {ranked.map((s, i) => (
            <RankedCard key={s.ticker} s={s} rank={i + 2} siblingBars={SIBLING_BARS} />
          ))}
        </div>
      </div>
    </section>
  );
}
