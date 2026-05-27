"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyGraph } from "d3-sankey";
import type { Sibling } from "./data";
import { useDataset } from "./dataset";
import { SectionHeader } from "./shared";

type NodeKind = "root" | "sibling" | "region";
type NodeData = {
  name: string;
  kind: NodeKind;
  color?: string;
  sibling?: Sibling;
};
type LinkData = { source: number; target: number; value: number; sibling: Sibling };

const REGION_COLOR: Record<string, string> = {
  "United States": "var(--accent)",
  "Developed Intl.": "var(--slice-intl)",
  "Emerging Mkts.": "var(--slice-em)",
  Canada: "var(--slice-ca)",
};

function fmtMoney(v: number, digits = 0): string {
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(digits === 0 ? 1 : 2) + "K";
  return (
    "$" +
    v.toLocaleString("en-CA", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

function AniMoney({
  value,
  duration = 350,
  digits = 0,
}: {
  value: number;
  duration?: number;
  digits?: number;
}) {
  const [d, setD] = useState(value);
  const prev = useRef(value);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    const from = prev.current;
    const to = value;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setD(from + (to - from) * e);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else prev.current = to;
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);
  return <span className="num">{fmtMoney(d, digits)}</span>;
}

export function MoneyFlow() {
  const { SIBLINGS, SIB_PALETTE, EFFECTIVE_HOLDINGS, REGION_OF_ETF } = useDataset();
  const [amount, setAmount] = useState(10_000);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { nodes, links } = useMemo(() => {
    type NodeBuild = NodeData & { index: number };
    const allNodes: NodeBuild[] = [];
    const nameToIdx = new Map<string, number>();
    const add = (name: string, props: Omit<NodeData, "name">): number => {
      const existing = nameToIdx.get(name);
      if (existing != null) return existing;
      const idx = allNodes.length;
      allNodes.push({ index: idx, name, ...props });
      nameToIdx.set(name, idx);
      return idx;
    };

    const root = add("$X", { kind: "root" });
    const sibIdxs = SIBLINGS.map((s) =>
      add(s.ticker, {
        kind: "sibling",
        color: SIB_PALETTE[s.color],
        sibling: s,
      })
    );
    const regionIdxs = new Map<string, number>();
    for (const s of SIBLINGS) {
      const r = REGION_OF_ETF[s.ticker];
      if (!regionIdxs.has(r)) {
        regionIdxs.set(
          r,
          add(r, { kind: "region", color: REGION_COLOR[r] })
        );
      }
    }

    const allLinks: LinkData[] = [];
    SIBLINGS.forEach((s, i) => {
      allLinks.push({
        source: root,
        target: sibIdxs[i],
        value: s.cageWeight,
        sibling: s,
      });
      allLinks.push({
        source: sibIdxs[i],
        target: regionIdxs.get(REGION_OF_ETF[s.ticker])!,
        value: s.cageWeight,
        sibling: s,
      });
    });

    const layout = sankey<NodeData, LinkData>()
      .nodeWidth(8)
      .nodePadding(14)
      .extent([
        [60, 1],
        [780, 360],
      ]);

    const graph: SankeyGraph<NodeData, LinkData> = {
      nodes: allNodes.map((n) => ({ ...n })),
      links: allLinks.map((l) => ({ ...l })),
    };
    const out = layout(graph);
    return { nodes: out.nodes, links: out.links };
  }, [REGION_OF_ETF, SIBLINGS, SIB_PALETTE]);

  const linkGen = sankeyLinkHorizontal();
  const presets = [1_000, 10_000, 50_000, 250_000];

  return (
    <section className="card card-pad hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200">
      <SectionHeader
        eyebrow="Allocation"
        title="What your money buys you"
        subtitle="Slide to set an amount. The flow updates with the dollar value at every step."
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[var(--fg-tertiary)] text-[20px]">$</span>
          <span
            className="font-serif text-[var(--fg)] num tracking-tight"
            style={{ fontSize: "clamp(36px, 5vw, 52px)", lineHeight: "1" }}
          >
            <AniMoney value={amount} duration={250} />
          </span>
          <span className="text-[12px] text-[var(--fg-tertiary)] ml-2">
            invested in CAGE
          </span>
        </div>
        <div className="flex-1 min-w-[180px]">
          <input
            type="range"
            min={Math.log10(100)}
            max={Math.log10(1_000_000)}
            step={0.01}
            value={Math.log10(amount)}
            onChange={(e) =>
              setAmount(Math.round(Math.pow(10, +e.target.value)))
            }
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[var(--fg-tertiary)] mt-1 num">
            <span>$100</span>
            <span>$1K</span>
            <span>$10K</span>
            <span>$100K</span>
            <span>$1M</span>
          </div>
        </div>
        <div className="flex gap-1">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={
                "px-2.5 h-7 text-[11px] rounded-md transition-colors " +
                (Math.abs(p - amount) < p * 0.01
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "border border-[var(--border)] text-[var(--fg-secondary)] hover:bg-[var(--surface-2)]")
              }
            >
              {fmtMoney(p, 0)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative -mx-2 px-2 overflow-x-auto">
        <svg
          viewBox="0 0 900 380"
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minWidth: 560 }}
        >
          {links.map((l, i) => {
            const isHover = hoverIdx === i;
            const isDimmed = hoverIdx != null && !isHover;
            const target = l.target as NodeData & { color?: string };
            const source = l.source as NodeData & { color?: string };
            const stroke =
              target.color || source.color || "var(--accent)";
            return (
              <path
                key={i}
                d={linkGen(l) || ""}
                fill="none"
                stroke={stroke}
                strokeOpacity={isHover ? 0.85 : isDimmed ? 0.08 : 0.35}
                strokeWidth={Math.max(1, l.width ?? 1)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{
                  transition: "stroke-opacity 220ms var(--ease-out)",
                  cursor: "default",
                }}
              />
            );
          })}

          {nodes.map((n, i) => {
            const color = n.color || "var(--fg)";
            const x0 = n.x0 ?? 0;
            const x1 = n.x1 ?? 0;
            const y0 = n.y0 ?? 0;
            const y1 = n.y1 ?? 0;
            return (
              <g key={i}>
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={Math.max(2, y1 - y0)}
                  fill={color}
                  rx="3"
                />
                <text
                  x={n.kind === "root" ? x0 - 8 : x1 + 8}
                  y={(y0 + y1) / 2}
                  textAnchor={n.kind === "root" ? "end" : "start"}
                  dominantBaseline="middle"
                  fontSize="11"
                  fontFamily={
                    n.kind === "sibling"
                      ? "var(--font-mono)"
                      : "var(--font-sans)"
                  }
                  fill="var(--fg)"
                  fontWeight={n.kind === "sibling" ? 500 : 400}
                >
                  {n.kind === "sibling" ? n.name.replace(".NE", "") : n.name}
                </text>
                <text
                  x={n.kind === "root" ? x0 - 8 : x1 + 8}
                  y={(y0 + y1) / 2 + 14}
                  textAnchor={n.kind === "root" ? "end" : "start"}
                  dominantBaseline="middle"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill="var(--fg-tertiary)"
                >
                  {fmtMoney(amount * (n.value || 0), 0)}
                </text>
              </g>
            );
          })}
        </svg>

        {hoverIdx != null && links[hoverIdx] && (
          <div className="absolute top-2 right-2 card card-pad py-2 px-3 text-[12px]">
            <div className="text-[var(--fg-tertiary)]">
              {(links[hoverIdx].source as NodeData).name} →{" "}
              {(links[hoverIdx].target as NodeData).name}
            </div>
            <div className="num font-medium text-[var(--fg)] mt-0.5">
              {fmtMoney(amount * links[hoverIdx].value, 0)}{" "}
              <span className="text-[var(--fg-tertiary)]">·</span>{" "}
              {(links[hoverIdx].value * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="h-eyebrow">Top effective holdings</span>
          <span className="text-[10px] text-[var(--fg-tertiary)]">
            Aggregated across siblings
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px]">
          {EFFECTIVE_HOLDINGS.slice(0, 12).map((h, i) => (
            <li
              key={h.name}
              className="flex items-center justify-between"
            >
              <span className="text-[var(--fg-secondary)] truncate pr-2">
                <span className="text-[var(--fg-tertiary)] num mr-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {h.name}
              </span>
              <span className="num text-[var(--fg)]">
                <AniMoney
                  value={amount * h.weight}
                  duration={300}
                  digits={amount * h.weight < 100 ? 2 : 0}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
