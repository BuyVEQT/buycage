"use client";

import { useMemo } from "react";
import { SIBLINGS, SIB_PALETTE, PRICE } from "./data";
import { SectionHeader } from "./shared";

function fmtPct(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function Leaderboard() {
  const sorted = useMemo(
    () =>
      [...SIBLINGS].sort(
        (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
      ),
    []
  );
  const maxAbs = useMemo(
    () => Math.max(...sorted.map((s) => Math.abs(s.contribution)), 0.001),
    [sorted]
  );
  const totalAbs = useMemo(
    () => sorted.reduce((s, x) => s + Math.abs(x.contribution), 0),
    [sorted]
  );
  const cageMove = PRICE.dayChangePct;

  return (
    <section className="mt-12">
      <SectionHeader
        eyebrow="Decomposition"
        title="What moved CAGE today"
        subtitle="Contribution to today's return = each sibling ETF's weight × its daily move."
        right={
          <span
            className={
              "text-[14px] font-medium num " +
              (cageMove >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]")
            }
          >
            CAGE {fmtPct(cageMove)}
          </span>
        }
      />

      <div className="card card-pad">
        <div className="mb-5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--fg-tertiary)] mb-2">
            <span>Share of today&apos;s total movement</span>
            <span className="num">{totalAbs.toFixed(3)}% absolute</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden flex bg-[var(--surface-2)]">
            {sorted.map((s) => {
              const share = Math.abs(s.contribution) / totalAbs;
              const isGain = s.contribution >= 0;
              const color = isGain
                ? `color-mix(in srgb, ${SIB_PALETTE[s.color]} 88%, white)`
                : `color-mix(in srgb, var(--loss) 72%, ${SIB_PALETTE[s.color]})`;
              return (
                <div
                  key={s.ticker}
                  title={`${s.ticker} · ${fmtPct(s.contribution, 3)}`}
                  className="h-full"
                  style={{ width: `${share * 100}%`, background: color }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px]">
            {sorted.map((s) => (
              <span
                key={s.ticker}
                className="inline-flex items-center gap-1.5 text-[var(--fg-tertiary)]"
              >
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ background: SIB_PALETTE[s.color] }}
                />
                {s.ticker.replace(".NE", "")}
              </span>
            ))}
          </div>
        </div>

        <div className="-mx-2">
          <div className="grid grid-cols-[1fr_64px_72px_72px_140px] gap-x-3 px-2 pb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--fg-tertiary)]">
            <span>Sibling</span>
            <span className="text-right">Weight</span>
            <span className="text-right">Day</span>
            <span className="text-right">Contrib.</span>
            <span></span>
          </div>
          <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {sorted.map((s) => {
              const c = s.contribution;
              const isGain = c >= 0;
              const color = isGain ? "var(--gain)" : "var(--loss)";
              const barWidth = (Math.abs(c) / maxAbs) * 100;
              return (
                <li
                  key={s.ticker}
                  className="grid grid-cols-[1fr_64px_72px_72px_140px] gap-x-3 px-2 py-3 items-center text-[13px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: SIB_PALETTE[s.color] }}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[12px] text-[var(--fg)]">
                        {s.ticker.replace(".NE", "")}
                      </div>
                      <div className="text-[11px] text-[var(--fg-tertiary)] truncate">
                        {s.name.replace("Avantis CIBC ", "")}
                      </div>
                    </div>
                  </div>
                  <span className="text-right num text-[var(--fg-secondary)]">
                    {(s.weight * 100).toFixed(0)}%
                  </span>
                  <span
                    className={
                      "text-right num " +
                      (s.dayChangePct >= 0
                        ? "text-[var(--gain)]"
                        : "text-[var(--loss)]")
                    }
                  >
                    {fmtPct(s.dayChangePct)}
                  </span>
                  <span
                    className="text-right num font-medium"
                    style={{ color }}
                  >
                    {fmtPct(c, 3)}
                  </span>
                  <div className="relative h-2 bg-[var(--surface-2)] rounded-full">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--border-strong)]" />
                    <div
                      className="absolute top-0 bottom-0 rounded-full"
                      style={{
                        background: color,
                        left: isGain ? "50%" : `calc(50% - ${barWidth / 2}%)`,
                        width: `${barWidth / 2}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
