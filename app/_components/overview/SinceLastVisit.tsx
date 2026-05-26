"use client";

import { useEffect, useState } from "react";
import { CAGE_BARS, PRICE } from "./data";
import { IconX } from "./icons";

const LV_KEY = "buycage:lastVisit";

function fmtRelative(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  return new Date(Date.now() - ms).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

type Visit = { ts: number; price: number; synthetic?: boolean };

export function SinceLastVisit() {
  const [state, setState] = useState<Visit | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LV_KEY);
      let prev: Visit | null = null;
      if (raw) {
        try {
          prev = JSON.parse(raw) as Visit;
        } catch {}
      }
      const now = Date.now();
      localStorage.setItem(
        LV_KEY,
        JSON.stringify({ ts: now, price: PRICE.current })
      );
      if (prev && prev.ts && prev.price && now - prev.ts > 30 * 1000) {
        setState(prev);
      } else if (!prev) {
        const yesterday = CAGE_BARS[CAGE_BARS.length - 2];
        setState({
          ts: yesterday.t,
          price: yesterday.close,
          synthetic: true,
        });
      }
    } catch {
      /* localStorage blocked */
    }
  }, []);

  if (!state || dismissed) return null;
  const delta = PRICE.current - state.price;
  const pct = (delta / state.price) * 100;
  const isGain = delta >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";
  const word = state.synthetic
    ? "Since yesterday"
    : `Since your last visit, ${fmtRelative(Date.now() - state.ts)}`;

  return (
    <div
      className="card flex items-center justify-between px-4 py-2.5 mt-4"
      style={{
        background: `linear-gradient(90deg, color-mix(in srgb, ${color} 5%, var(--surface-1)) 0%, var(--surface-1) 80%)`,
      }}
    >
      <div className="flex items-center gap-3 text-[13px]">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
            style={{ background: color }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: color }}
          />
        </span>
        <span className="text-[var(--fg-secondary)]">{word}</span>
        <span className="num font-medium" style={{ color }}>
          {isGain ? "+" : ""}${Math.abs(delta).toFixed(2)} · {isGain ? "+" : ""}
          {pct.toFixed(2)}%
        </span>
        <span className="text-[var(--fg-tertiary)] text-[12px] hidden sm:inline">
          from ${state.price.toFixed(2)}
        </span>
      </div>
      <button
        className="text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] -mr-1 p-1"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}
