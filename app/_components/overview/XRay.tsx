"use client";

import { useMemo, useState } from "react";
import type { Sibling, Holding } from "./data";
import { useDataset } from "./dataset";

function pol(r: number, a: number): [number, number] {
  return [Math.cos(a) * r, Math.sin(a) * r];
}
function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pol(r1, a0);
  const [x1, y1] = pol(r1, a1);
  const [x2, y2] = pol(r0, a1);
  const [x3, y3] = pol(r0, a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

type HoldingArc = Holding & { a0: number; a1: number; parent: Sibling };
type SibArc = {
  sibling: Sibling;
  a0: number;
  a1: number;
  holdings: HoldingArc[];
};
type Hover =
  | { kind: "sibling"; id: string; label: string; sublabel: string; weight: number }
  | { kind: "holding"; id: string; label: string; sublabel: string; weight: number };

export function XRay() {
  const { SIBLINGS, SIB_PALETTE } = useDataset();
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const size = 520,
    cx = size / 2,
    cy = size / 2;
  const r0 = 56,
    r1 = 102,
    r2 = 168,
    r3 = 232;

  const layout: SibArc[] = useMemo(() => {
    let acc = -Math.PI / 2;
    return SIBLINGS.map((s) => {
      const span = s.cageWeight * Math.PI * 2;
      const a0 = acc,
        a1 = acc + span;
      acc = a1;
      const top = [...s.holdings].sort((a, b) => b.weight - a.weight).slice(0, 8);
      const sumTop = top.reduce((sum, h) => sum + h.weight, 0);
      let hAcc = a0;
      const holdArcs = top.map((h) => {
        const hSpan = (h.weight / sumTop) * span;
        const a0h = hAcc,
          a1h = hAcc + hSpan;
        hAcc = a1h;
        return { ...h, a0: a0h, a1: a1h, parent: s };
      });
      return { sibling: s, a0, a1, holdings: holdArcs };
    });
  }, [SIBLINGS]);

  function effWeight(parent: Sibling, h: Holding): number {
    return parent.cageWeight * h.weight;
  }

  const inFocus = focus ? layout.find((l) => l.sibling.ticker === focus) : null;

  return (
    <section className="card card-pad hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200">
      <header className="mb-3">
        <div className="flex items-baseline justify-between">
          <h3 className="h-title">X-Ray</h3>
          <span className="h-eyebrow">Effective holdings</span>
        </div>
        <p className="text-[12.5px] text-[var(--fg-tertiary)] mt-1">
          Click a sibling to drill into its top holdings. Outer ring is
          weighted by <em>effective</em> weight (in CAGE), not weight within
          the sub-ETF.
        </p>
      </header>

      <div
        className="relative"
        style={{ aspectRatio: "1 / 1", maxWidth: size }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          <g transform={`translate(${cx}, ${cy})`}>
            {layout.flatMap((l) =>
              l.holdings.map((h) => {
                const isFaded =
                  inFocus && inFocus.sibling.ticker !== l.sibling.ticker;
                const id = l.sibling.ticker + ":" + h.name;
                const isHover = hover?.kind === "holding" && hover.id === id;
                return (
                  <path
                    key={id}
                    d={arcPath(r2, r3, h.a0, h.a1)}
                    fill={SIB_PALETTE[l.sibling.color]}
                    fillOpacity={isHover ? 1 : isFaded ? 0.06 : 0.6}
                    stroke="var(--bg)"
                    strokeWidth="1"
                    style={{
                      transition:
                        "fill-opacity 350ms var(--ease-out), transform 350ms var(--ease-out)",
                      cursor: "default",
                    }}
                    onMouseEnter={() =>
                      setHover({
                        kind: "holding",
                        id,
                        label: h.name,
                        sublabel: `via ${l.sibling.ticker.replace(".NE", "")}`,
                        weight: effWeight(l.sibling, h),
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })
            )}

            {layout.map((l) => {
              const isFocused =
                !!inFocus && inFocus.sibling.ticker === l.sibling.ticker;
              const isFaded = !!inFocus && !isFocused;
              const isHover =
                hover?.kind === "sibling" && hover.id === l.sibling.ticker;
              return (
                <path
                  key={l.sibling.ticker}
                  d={arcPath(r1, r2, l.a0, l.a1)}
                  fill={SIB_PALETTE[l.sibling.color]}
                  fillOpacity={
                    isHover || isFocused ? 1 : isFaded ? 0.18 : 0.88
                  }
                  stroke="var(--bg)"
                  strokeWidth="1.5"
                  style={{
                    cursor: "pointer",
                    transition: "fill-opacity 300ms var(--ease-out)",
                  }}
                  onMouseEnter={() =>
                    setHover({
                      kind: "sibling",
                      id: l.sibling.ticker,
                      label: l.sibling.ticker.replace(".NE", ""),
                      sublabel: l.sibling.name.replace("Avantis CIBC ", ""),
                      weight: l.sibling.cageWeight,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() =>
                    setFocus(isFocused ? null : l.sibling.ticker)
                  }
                />
              );
            })}

            {layout.map((l) => {
              const mid = (l.a0 + l.a1) / 2;
              const [tx, ty] = pol((r1 + r2) / 2, mid);
              const isFaded =
                !!inFocus && inFocus.sibling.ticker !== l.sibling.ticker;
              return (
                <text
                  key={"lbl-" + l.sibling.ticker}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="var(--bg)"
                  fontFamily="var(--font-mono)"
                  fontWeight="500"
                  style={{
                    opacity: isFaded ? 0.25 : 0.92,
                    transition: "opacity 300ms var(--ease-out)",
                    pointerEvents: "none",
                  }}
                >
                  {l.sibling.ticker.replace(".NE", "")}
                </text>
              );
            })}

            <circle
              r={r0}
              fill="var(--surface-1)"
              stroke="var(--border)"
              strokeWidth="1"
              style={{ cursor: focus ? "pointer" : "default" }}
              onClick={() => focus && setFocus(null)}
            />
          </g>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hover ? (
            <>
              <span className="h-eyebrow">
                {hover.kind === "sibling" ? "Sibling ETF" : "Holding"}
              </span>
              <span className="font-medium text-[15px] text-[var(--fg)] mt-1 text-center px-4 leading-tight">
                {hover.label}
              </span>
              <span className="text-[11px] text-[var(--fg-tertiary)] mt-0.5 text-center px-4 leading-tight">
                {hover.sublabel}
              </span>
              <span className="font-medium text-[20px] num mt-1 text-[var(--fg)]">
                {(hover.weight * 100).toFixed(hover.weight < 0.01 ? 2 : 1)}%
              </span>
              <span className="text-[10px] text-[var(--fg-tertiary)]">
                of CAGE
              </span>
            </>
          ) : focus ? (
            <>
              <span className="h-eyebrow">Drilled into</span>
              <span className="font-mono text-[17px] text-[var(--fg)] mt-1">
                {focus.replace(".NE", "")}
              </span>
              <button
                onClick={() => setFocus(null)}
                className="text-[10px] text-[var(--fg-tertiary)] underline mt-2 pointer-events-auto"
              >
                Reset
              </button>
            </>
          ) : (
            <>
              <span
                className="font-serif italic text-[var(--fg)]"
                style={{ fontSize: 24 }}
              >
                CAGE
              </span>
              <span className="text-[10px] text-[var(--fg-tertiary)] mt-0.5">
                100% allocated
              </span>
              <span className="text-[10px] text-[var(--fg-tertiary)] mt-2">
                Click a slice
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
