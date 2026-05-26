"use client";

import { useEffect, useMemo, useState } from "react";
import { TODAYS_BRIEF } from "./data";

export function TodaysBrief() {
  const text = TODAYS_BRIEF;
  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString("en-CA", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      const p = elapsed / 26;
      setPhase(p);
      if (p < words.length + 8) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [words.length]);

  return (
    <section className="mt-6">
      <div className="card card-pad py-4">
        <div className="flex items-baseline gap-3 flex-wrap mb-2">
          <span className="h-eyebrow">Today&apos;s brief</span>
          <span className="text-[11px] text-[var(--fg-tertiary)] num">
            {dateStr}
          </span>
        </div>
        <p
          className="font-serif text-[var(--fg-secondary)] tracking-tight leading-[1.45]"
          style={{ fontSize: "clamp(14px, 1.4vw, 17px)" }}
        >
          {words.map((w, i) => {
            const t = Math.max(0, Math.min(1, (phase - i) / 8));
            const eased = 1 - Math.pow(1 - t, 3);
            return (
              <span
                key={i}
                style={{
                  opacity: eased,
                  transform: `translateY(${(1 - eased) * 4}px)`,
                  display: /^\s+$/.test(w) ? "inline" : "inline-block",
                }}
              >
                {w}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
