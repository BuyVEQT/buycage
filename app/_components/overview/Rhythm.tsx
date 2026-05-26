"use client";

import { useMemo, useState } from "react";
import type { Direction } from "./data";
import { useDataset } from "./dataset";
import { IconTrendDown, IconTrendUp } from "./icons";

type Week = { ts: string | null; days: Record<number, Direction> };

export function Rhythm() {
  const { CAGE_BARS, DIRECTIONS, STREAKS } = useDataset();
  const dirs = DIRECTIONS;
  const last60 = dirs.slice(-60);

  const grid = useMemo<Week[]>(() => {
    const weeks: Week[] = [];
    let cur: Week = { ts: null, days: {} };
    for (const b of last60) {
      const d = new Date(b.t);
      const dow = d.getDay();
      const mondayOffset = (dow + 6) % 7;
      const monday = new Date(d);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - mondayOffset);
      const wk = monday.toISOString().slice(0, 10);
      if (cur.ts !== wk) {
        cur = { ts: wk, days: {} };
        weeks.push(cur);
      }
      cur.days[dow] = b;
    }
    return weeks;
  }, [last60]);

  const maxAbs = useMemo(
    () => Math.max(...last60.map((b) => Math.abs(b.ret)), 0.005),
    [last60]
  );

  const [hover, setHover] = useState<Direction | null>(null);

  function cellColor(ret: number) {
    const intensity = Math.min(1, Math.abs(ret) / maxAbs);
    const base = ret >= 0 ? "var(--gain)" : "var(--loss)";
    const alpha = 0.18 + intensity * 0.7;
    return `color-mix(in srgb, ${base} ${alpha * 100}%, var(--surface-2))`;
  }

  const cur = STREAKS.current;
  const ups = STREAKS.last30.ups;
  const downs = STREAKS.last30.downs;
  const flats = STREAKS.last30.total - ups - downs;

  return (
    <section className="card card-pad">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="h-title">Streak &amp; rhythm</h3>
        <span className="h-eyebrow">Last 12 wks</span>
      </div>
      <p className="text-[12.5px] text-[var(--fg-tertiary)] mb-5">
        Daily up vs. down sessions. Color intensity scales with the size of the
        move.
      </p>

      <div className="flex items-end justify-between gap-6 mb-5">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="num font-medium text-[var(--fg)]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "44px",
                lineHeight: "1",
                letterSpacing: "-0.02em",
              }}
            >
              {cur.count}
            </span>
            <span className="text-[14px] text-[var(--fg-secondary)]">
              {cur.dir > 0 ? "up day" : "down day"}
              {cur.count !== 1 ? "s" : ""} in a row
            </span>
            <span style={{ color: cur.dir > 0 ? "var(--gain)" : "var(--loss)" }}>
              {cur.dir > 0 ? <IconTrendUp size={16} /> : <IconTrendDown size={16} />}
            </span>
          </div>
          <div className="text-[11px] text-[var(--fg-tertiary)] mt-1">
            Current streak
          </div>
        </div>

        <div className="flex-1 max-w-[200px]">
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--surface-2)]">
            <div
              className="bg-[var(--gain)]"
              style={{
                width: `${(ups / STREAKS.last30.total) * 100}%`,
              }}
            />
            <div
              className="bg-[var(--loss)]"
              style={{
                width: `${(downs / STREAKS.last30.total) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] num">
            <span className="text-[var(--gain)]">{ups} up</span>
            <span className="text-[var(--fg-tertiary)]">
              {flats > 0 ? `${flats} flat` : ""}
            </span>
            <span className="text-[var(--loss)]">{downs} down</span>
          </div>
          <div className="text-[10px] text-[var(--fg-tertiary)] mt-0.5 text-right">
            Last 30 sessions
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card card-pad py-3 px-3.5">
          <div className="h-eyebrow mb-1">Best up streak</div>
          <div className="text-[20px] font-medium num text-[var(--gain)]">
            {STREAKS.bestUp}
          </div>
        </div>
        <div className="card card-pad py-3 px-3.5">
          <div className="h-eyebrow mb-1">Worst down streak</div>
          <div className="text-[20px] font-medium num text-[var(--loss)]">
            {STREAKS.worstDown}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-[3px] items-start">
          <div className="flex flex-col gap-[3px] text-[9px] text-[var(--fg-tertiary)] pr-1 pt-[1px]">
            {["M", "T", "W", "T", "F"].map((d, i) => (
              <span key={i} className="h-[14px] leading-[14px]">
                {d}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px] flex-1 overflow-x-auto">
            {grid.map((wk, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {[1, 2, 3, 4, 5].map((dow) => {
                  const bar = wk.days[dow];
                  if (!bar)
                    return (
                      <div
                        key={dow}
                        className="w-[14px] h-[14px] rounded-[3px] bg-[var(--surface-2)] opacity-40"
                      />
                    );
                  const isToday =
                    bar.t === CAGE_BARS[CAGE_BARS.length - 1].t;
                  return (
                    <button
                      key={dow}
                      onMouseEnter={() => setHover(bar)}
                      onMouseLeave={() => setHover(null)}
                      className="w-[14px] h-[14px] rounded-[3px]"
                      style={{
                        background: cellColor(bar.ret),
                        outline: isToday ? "1.5px solid var(--fg)" : "none",
                        outlineOffset: isToday ? "1px" : 0,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="h-6 mt-3 text-[11px] num text-[var(--fg-secondary)]">
          {hover ? (
            <span>
              <span className="text-[var(--fg-tertiary)]">
                {new Date(hover.t).toLocaleDateString("en-CA", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>{" "}
              <span
                style={{
                  color: hover.ret >= 0 ? "var(--gain)" : "var(--loss)",
                }}
              >
                {hover.ret >= 0 ? "+" : ""}
                {(hover.ret * 100).toFixed(2)}%
              </span>
            </span>
          ) : (
            <span className="text-[var(--fg-tertiary)]">
              Hover a cell for details
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--fg-tertiary)]">
          <span>Less</span>
          {[0.15, 0.35, 0.55, 0.8, 1].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{
                background: `color-mix(in srgb, var(--gain) ${i * 100}%, var(--surface-2))`,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
