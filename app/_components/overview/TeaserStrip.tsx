"use client";

import Link from "next/link";
import { useDataset } from "./dataset";
import { Sparkline } from "./shared";

function TeaserCard({
  eyebrow,
  title,
  copy,
  children,
  href,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="
        card card-pad group flex flex-col gap-4 min-h-[220px] cursor-pointer
        transition-all duration-300 ease-out relative overflow-hidden
        hover:border-[var(--accent)] hover:-translate-y-1
        hover:shadow-[0_12px_32px_-12px_color-mix(in_srgb,var(--accent)_40%,transparent)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
      "
    >
      {/* Soft accent wash that appears on hover */}
      <span
        aria-hidden
        className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none
        "
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 60%)",
        }}
      />

      <div className="flex items-center justify-between relative">
        <span className="h-eyebrow">{eyebrow}</span>
        <span
          className="
            text-[11px] font-medium text-[var(--fg-tertiary)]
            group-hover:text-[var(--accent)] transition-all duration-300
            inline-flex items-center gap-1
            group-hover:translate-x-0.5
          "
        >
          Open
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
      <div
        className="
          font-serif text-[var(--fg)] tracking-tight leading-[1.05] relative
          group-hover:text-[var(--accent)] transition-colors duration-300
        "
        style={{ fontSize: 22, letterSpacing: "-0.01em" }}
      >
        {title}
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        {children}
      </div>
      <p className="text-[11.5px] text-[var(--fg-tertiary)] leading-snug relative">
        {copy}
      </p>
    </Link>
  );
}

function MiniHeat() {
  const { CAGE_BARS } = useDataset();
  const last30 = CAGE_BARS.slice(-30);
  const maxAbs = Math.max(...last30.map((b, i) => {
    if (i === 0) return 0.001;
    return Math.abs((b.close - last30[i - 1].close) / last30[i - 1].close);
  }), 0.005);
  return (
    <div className="flex gap-[3px]">
      {last30.slice(1).map((b, i) => {
        const prev = last30[i].close;
        const ret = (b.close - prev) / prev;
        const intensity = Math.min(1, Math.abs(ret) / maxAbs);
        const base = ret >= 0 ? "var(--gain)" : "var(--loss)";
        const alpha = 0.18 + intensity * 0.7;
        return (
          <div
            key={b.t}
            className="w-[8px] h-[28px] rounded-[2px]"
            style={{
              background: `color-mix(in srgb, ${base} ${alpha * 100}%, var(--surface-2))`,
            }}
          />
        );
      })}
    </div>
  );
}

function MiniDonut() {
  const { SIBLINGS } = useDataset();
  // Tiny sunburst preview — 5 sibling wedges from a center
  const size = 96;
  const cx = size / 2;
  const cy = size / 2;
  const r0 = 18;
  const r1 = 42;
  let acc = -Math.PI / 2;
  const COLORS: Record<string, string> = {
    us: "var(--accent)",
    intl: "var(--slice-intl)",
    em: "var(--slice-em)",
    ca: "var(--slice-ca)",
    smallcap: "var(--slice-sc)",
  };

  function arc(a0: number, a1: number, color: string) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = [Math.cos(a0) * r1, Math.sin(a0) * r1];
    const [x1, y1] = [Math.cos(a1) * r1, Math.sin(a1) * r1];
    const [x2, y2] = [Math.cos(a1) * r0, Math.sin(a1) * r0];
    const [x3, y3] = [Math.cos(a0) * r0, Math.sin(a0) * r0];
    const d = `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
    return { d, color };
  }

  const wedges = SIBLINGS.map((s) => {
    const span = s.cageWeight * Math.PI * 2;
    const a0 = acc,
      a1 = acc + span;
    acc = a1;
    return arc(a0, a1, COLORS[s.color]);
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={96} height={96}>
      <g transform={`translate(${cx}, ${cy})`}>
        {wedges.map((w, i) => (
          <path
            key={i}
            d={w.d}
            fill={w.color}
            fillOpacity={0.85}
            stroke="var(--bg)"
            strokeWidth="1"
          />
        ))}
      </g>
    </svg>
  );
}

function MiniSpark() {
  const { CAGE_BARS } = useDataset();
  const series = CAGE_BARS.slice(-60).map((b) => ({ t: b.t, price: b.close }));
  return (
    <Sparkline data={series} color="var(--accent)" width={220} height={56} strokeWidth={1.5} />
  );
}

export function TeaserStrip() {
  const { EFFECTIVE_HOLDINGS, STREAKS } = useDataset();
  const topHolding = EFFECTIVE_HOLDINGS[0];
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between mb-5 gap-4">
        <div>
          <div className="h-eyebrow mb-1">Go deeper</div>
          <h2 className="h-title">Inside CAGE</h2>
          <p className="text-[13px] text-[var(--fg-tertiary)] mt-1 max-w-[640px]">
            Streak history, full holdings breakdown, and a live allocation
            sandbox — interactive widgets live on the dedicated page.
          </p>
        </div>
        <Link
          href="/inside"
          className="hidden md:inline-flex text-[12px] text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors items-center gap-1.5 border border-[var(--border)] rounded-md h-8 px-3"
        >
          Open all
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TeaserCard
          eyebrow="Rhythm"
          title={`${STREAKS.current.count} ${STREAKS.current.dir > 0 ? "up" : "down"} day${STREAKS.current.count === 1 ? "" : "s"} running`}
          copy="Calendar heatmap of every session, with best/worst streaks and the 30-day up/down rhythm."
          href="/inside#rhythm"
        >
          <MiniHeat />
        </TeaserCard>

        <TeaserCard
          eyebrow="X-Ray"
          title={`What's inside · ${topHolding.name}`}
          copy="Sunburst from CAGE to its five sibling ETFs to their underlying holdings. Click a slice to drill down."
          href="/inside#xray"
        >
          <MiniDonut />
        </TeaserCard>

        <TeaserCard
          eyebrow="Allocation"
          title="What your money buys you"
          copy="Slide an amount through CAGE to its sibling ETFs to their regions. Watch every dollar flow."
          href="/inside#flow"
        >
          <MiniSpark />
        </TeaserCard>
      </div>
    </section>
  );
}
