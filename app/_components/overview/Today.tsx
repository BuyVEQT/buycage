"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useDataset } from "./dataset";
import { SIB_PALETTE } from "./data";
import {
  SLEEVE_META,
  TODAY_HOLDINGS,
  TODAY_FACTORS,
  SEARCH_FIXTURES,
} from "./today.data";
import { SiteHeader } from "../chrome/SiteHeader";
import { SiteFooter } from "../chrome/SiteFooter";
import "./today.css";

const TAU = Math.PI * 2;

function arc(a0: number, a1: number, r0: number, r1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = Math.sin(a0) * r1,
    y0 = -Math.cos(a0) * r1;
  const x1 = Math.sin(a1) * r1,
    y1 = -Math.cos(a1) * r1;
  const x2 = Math.sin(a1) * r0,
    y2 = -Math.cos(a1) * r0;
  const x3 = Math.sin(a0) * r0,
    y3 = -Math.cos(a0) * r0;
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

function sparkPath(seed: number, dir: number): string {
  let v = 0;
  const pts = [v];
  for (let k = 1; k < 22; k++) {
    v +=
      Math.sin(k * (0.7 + seed * 0.13)) * 0.5 +
      Math.cos(k * 0.31 + seed) * 0.35 +
      (dir > 0 ? 0.16 : -0.04);
    pts.push(v);
  }
  const min = Math.min(...pts),
    max = Math.max(...pts),
    dy = max - min || 1;
  const x = (i: number) => (i / 21) * 52;
  const y = (vv: number) => 18 - 2 - ((vv - min) / dy) * 14;
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
}

function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, dur = 800, enabled = true): number {
  const [v, setV] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setV(ease(t) * target);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur, enabled]);
  return v;
}

// ─── Hero price slab ──────────────────────────────────────────────────────────
function PriceSlab() {
  const { PRICE, STREAKS, RETURNS, TODAYS_BRIEF, fetchedAt } = useDataset();
  const hasPrice = PRICE.current > 0;
  const animated = useCountUp(PRICE.current, 800, hasPrice);
  const gain = PRICE.dayChange >= 0;

  const volRatio =
    PRICE.avgVolume20d > 0 ? PRICE.volume / PRICE.avgVolume20d : null;
  const pos52 =
    PRICE.week52Range[1] > PRICE.week52Range[0]
      ? ((PRICE.current - PRICE.week52Range[0]) /
          (PRICE.week52Range[1] - PRICE.week52Range[0])) *
        100
      : null;
  const si = RETURNS.fund.SI;
  const dateLabel = new Date(fetchedAt ?? Date.now()).toLocaleDateString("en-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="hero-right">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span className="hr-tag">
          <span className="live-dot">
            <span className="ring" />
            <span className="core" />
          </span>
          Live
        </span>
        <CageGlyph />
      </div>
      <div className="hr-name">Avantis CIBC All-Equity Asset Allocation ETF</div>
      <div className="hr-price">
        <span className="d">$</span>
        <span className="v num">{hasPrice ? animated.toFixed(2) : "—"}</span>
      </div>
      <div className="hr-change-row">
        {hasPrice && (
          <span className={`hr-change${gain ? "" : " dn"}`}>
            <svg width="11" height="11" viewBox="0 0 11 11" style={{ transform: gain ? "none" : "rotate(180deg)" }}>
              <path d="M2 7 L5.5 3.5 L9 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </svg>
            {gain ? "+" : ""}
            {PRICE.dayChange.toFixed(2)} · {gain ? "+" : ""}
            {PRICE.dayChangePct.toFixed(2)}%
          </span>
        )}
        <div className="hr-read">
          <div className="head">
            <span className="dot" />
            <span className="l">Today&apos;s read</span>
            <span className="ts">{dateLabel}</span>
          </div>
          <p>{TODAYS_BRIEF || "Awaiting today's market data."}</p>
          <Link href="/inside#rhythm" className="more">
            See the rhythm <span className="arr">→</span>
          </Link>
        </div>
      </div>

      <div className="hr-stats">
        <div className="hr-stat" data-tip="Consecutive up/down sessions into today's close. Mean-reversion often kicks in above 5.">
          <div className="l">Streak</div>
          <div className="v num" style={{ color: STREAKS.current.dir >= 0 ? "var(--gain)" : "var(--loss)" }}>
            {STREAKS.current.count} {STREAKS.current.dir >= 0 ? "↑" : "↓"}
          </div>
          <div className="s">running</div>
        </div>
        <div className="hr-stat" data-tip="Today's volume vs the trailing 20-day average. >1.5× often signals institutional rebalancing.">
          <div className="l">Volume</div>
          <div className="v num">{volRatio != null ? `${volRatio.toFixed(2)}×` : "—"}</div>
          <div className="s">vs 20d avg</div>
        </div>
        <div className="hr-stat" data-tip="Total return since 18 Mar 2026 inception, net of 0.28% MER. Benchmark: MSCI ACWI IMI.">
          <div className="l">Since incept.</div>
          <div className="v num" style={{ color: si >= 0 ? "var(--gain)" : "var(--loss)" }}>
            {si >= 0 ? "+" : ""}
            {si.toFixed(1)}%
          </div>
          <div className="s">vs ACWI +16.8%</div>
        </div>
        <div className="hr-stat" data-tip="Position within the 52-week range. Above 75% = near the high.">
          <div className="l">52-wk pos.</div>
          <div className="v num">{pos52 != null ? `${Math.round(pos52)}%` : "—"}</div>
          <div className="s">{pos52 != null && pos52 > 75 ? "near high" : "of range"}</div>
        </div>
      </div>
    </div>
  );
}

function CageGlyph() {
  return (
    <div id="cage-glyph">
      <svg viewBox="-50 -50 100 100" width="72" height="72" overflow="visible">
        <rect x="-44" y="-44" width="88" height="88" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <g className="glyph-orbit">
          <circle cx="0" cy="-36" r="4" fill="var(--hot)" />
          <circle cx="32" cy="20" r="3" fill="var(--ink)" />
          <circle cx="-32" cy="20" r="3" fill="var(--ink)" />
        </g>
        <text x="0" y="6" textAnchor="middle" fontFamily="var(--display)" fontWeight="400" fontSize="32" fill="var(--ink)" letterSpacing="-0.04em">
          C
        </text>
      </svg>
    </div>
  );
}

// ─── X-Ray: sunburst + legend + dossier + holdings table ──────────────────────
function XRay() {
  const { SIBLINGS } = useDataset();
  const [active, setActive] = useState<string | null>(null);

  const sleeves = useMemo(
    () =>
      SIBLINGS.map((s) => ({
        t: s.ticker,
        color: SIB_PALETTE[s.color],
        weight: s.weight,
        day: s.dayChangePct,
        contribution: s.contribution,
      })),
    [SIBLINGS]
  );

  // sunburst geometry
  const { sleeveArcs, leafArcs } = useMemo(() => {
    const sleeveArcs: { t: string; d: string; color: string; lx: number; ly: number; w: number; show: boolean }[] = [];
    const leafArcs: { t: string; d: string; color: string; alpha: number; key: string }[] = [];
    const sub = [0.28, 0.22, 0.18, 0.14, 0.1, 0.08];
    let acc = 0;
    for (const s of sleeves) {
      const a0 = acc,
        a1 = acc + s.weight * TAU;
      acc = a1;
      const mid = (a0 + a1) / 2;
      sleeveArcs.push({
        t: s.t,
        d: arc(a0, a1, 40, 106),
        color: s.color,
        lx: Math.sin(mid) * 72,
        ly: -Math.cos(mid) * 72,
        w: s.weight,
        show: s.weight > 0.07,
      });
      let aacc = a0;
      sub.forEach((p, i) => {
        const sa0 = aacc,
          sa1 = aacc + (a1 - a0) * p;
        aacc = sa1;
        leafArcs.push({ t: s.t, d: arc(sa0, sa1, 110, 156), color: s.color, alpha: 0.8 - i * 0.1, key: `${s.t}-${i}` });
      });
    }
    return { sleeveArcs, leafArcs };
  }, [sleeves]);

  const holdings = active ? TODAY_HOLDINGS.filter((h) => h.sleeve === active) : TODAY_HOLDINGS;
  const colorOf = (sleeve: string) => sleeves.find((s) => s.t === sleeve)?.color ?? "var(--ink-3)";
  const activeSleeve = active ? sleeves.find((s) => s.t === active) : null;
  const activeMeta = active ? SLEEVE_META[active] : null;

  return (
    <section className="sec">
      <div className="sec-head">
        <div className="num">02</div>
        <h2>What you <em>actually</em> own.</h2>
        <div className="right">As of today<br />~9,000 holdings</div>
      </div>

      <div className="xray-wrap">
        <div className="xray-vis">
          <svg viewBox="-200 -200 400 400" onClick={(e) => { if ((e.target as Element).getAttribute("data-reset")) setActive(null); }}>
            <circle cx="0" cy="0" r="36" fill="var(--bg)" stroke="var(--ink)" strokeWidth="2" data-reset="1" style={{ cursor: "pointer" }} onClick={() => setActive(null)} />
            <text x="0" y="-3" textAnchor="middle" fontFamily="var(--display)" fontWeight="400" fontSize="20" fill="var(--ink)" letterSpacing="-0.04em" pointerEvents="none">CAGE</text>
            <text x="0" y="12" textAnchor="middle" fontFamily="var(--mono)" fontSize="8.5" fill="var(--hot)" letterSpacing="0.18em" pointerEvents="none">100%</text>
            {leafArcs.map((l) => (
              <path key={l.key} d={l.d} fill={l.color} fillOpacity={active == null ? l.alpha : l.t === active ? 0.9 : 0.15} stroke="var(--bg)" strokeWidth="1" className="sb-leaf" pointerEvents="none" />
            ))}
            {sleeveArcs.map((s) => (
              <g key={s.t}>
                <path d={s.d} fill={s.color} fillOpacity={active == null ? 1 : s.t === active ? 1 : 0.4} stroke="var(--bg)" strokeWidth="2" className="sb-sleeve" style={{ cursor: "pointer" }} onClick={() => setActive(s.t === active ? null : s.t)} />
                {s.show && (
                  <>
                    <text x={s.lx} y={s.ly - 3} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--mono)" fontSize="9.5" fill="var(--bg)" letterSpacing="0.1em" fontWeight="700" pointerEvents="none">{s.t}</text>
                    <text x={s.lx} y={s.ly + 10} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--display)" fontWeight="400" fontSize="12" fill="var(--bg)" pointerEvents="none">{(s.w * 100).toFixed(1)}%</text>
                  </>
                )}
              </g>
            ))}
            <circle cx="0" cy="0" r="160" fill="none" stroke="var(--line-strong)" strokeWidth="0.8" strokeDasharray="3 4" />
          </svg>

          <div className="xray-sleeves">
            <div className="l">5 Sleeves · click to filter</div>
            {sleeves.map((s) => (
              <div key={s.t} className={`xray-srow${active === s.t ? " active" : ""}`} onClick={() => setActive(s.t === active ? null : s.t)}>
                <span className="sw" style={{ background: s.color }} />
                <span className="n">
                  {SLEEVE_META[s.t]?.shortName ?? s.t}
                  <span className="t">{s.t}</span>
                </span>
                <span className="w num">{(s.weight * 100).toFixed(1)}%</span>
                <span className={`ch ${s.day >= 0 ? "gain" : "loss"} num`}>
                  {s.day >= 0 ? "+" : ""}
                  {s.day.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          <div className={`sleeve-dossier${active ? " on" : ""}`}>
            {activeSleeve && activeMeta && (
              <>
                <div className="ssh-head">
                  <div className="ssh-name">
                    {activeMeta.shortName}
                    <em>{active}</em>
                  </div>
                  <div className="ssh-tk">{activeMeta.region} · {activeMeta.holdings} holdings</div>
                </div>
                <div className="ssh-stats">
                  <div className="ssh-stat"><div className="l">Weight</div><div className="v">{(activeSleeve.weight * 100).toFixed(1)}%</div></div>
                  <div className="ssh-stat"><div className="l">Day</div><div className={`v ${activeSleeve.day >= 0 ? "gain" : "loss"}`}>{activeSleeve.day >= 0 ? "+" : ""}{activeSleeve.day.toFixed(2)}%</div></div>
                  <div className="ssh-stat"><div className="l">Contrib.</div><div className={`v ${activeSleeve.contribution >= 0 ? "gain" : "loss"}`}>{activeSleeve.contribution >= 0 ? "+" : ""}{activeSleeve.contribution.toFixed(2)} pp</div></div>
                </div>
                <p className="ssh-line" dangerouslySetInnerHTML={{ __html: activeMeta.dossierLine }} />
                <div className="ssh-factors">
                  {activeMeta.factors.map((fa) => {
                    const w = Math.min(50, (Math.abs(fa.v) * 100) / 0.7);
                    return (
                      <div className="sfac" key={fa.n}>
                        <div className="l">{fa.n}</div>
                        <div className="bar"><div className="mid" /><div className={`fill ${fa.neg ? "neg" : "pos"}`} style={{ width: `${w.toFixed(1)}%` }} /></div>
                        <div className={`v ${fa.neg ? "neg" : ""}`}>{fa.v >= 0 ? "+" : ""}{fa.v.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="xray-table">
          <div className="xray-filter">
            <div>
              <span className="label">Filter</span>
              <span className="val">
                {active
                  ? `${active} · ${SLEEVE_META[active]?.shortName} · showing ${holdings.length} of top 20`
                  : "All sleeves · showing 20 of ~9,000"}
              </span>
            </div>
            <span className={`reset${active ? " on" : ""}`} onClick={() => setActive(null)}>Clear ✕</span>
          </div>
          <div className="xray-thead">
            <div />
            <div>Holding</div>
            <div className="r">Ticker</div>
            <div className="r">Sleeve</div>
            <div className="r">Weight</div>
            <div className="r">Day</div>
            <div className="r">30d</div>
          </div>
          <div className="xray-tbody">
            {holdings.map((h, i) => (
              <div className="xray-trow" key={h.tk} style={{ animationDelay: `${i * 0.015}s` }}>
                <span className="sw" style={{ background: colorOf(h.sleeve) }} />
                <div><div className="nm">{h.nm}<span className="role">{h.role}</span></div></div>
                <div className="tk">{h.tk}</div>
                <div className="sl">{h.sleeve}</div>
                <div className="wt num">{h.wt.toFixed(2)}%</div>
                <div className={`ch ${h.ch >= 0 ? "gain" : "loss"} num`}>{h.ch >= 0 ? "+" : ""}{h.ch.toFixed(2)}%</div>
                <div className="sp">
                  <svg viewBox="0 0 52 18" preserveAspectRatio="none">
                    <path d={sparkPath(i, h.ch)} fill="none" stroke={h.ch >= 0 ? "var(--gain)" : "var(--hot)"} strokeWidth="1.3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
          <div className="xray-foot">
            <span><strong>Top 20</strong> by effective weight in CAGE</span>
            <span>Coverage: <strong>11.4%</strong> of fund · long tail <strong>88.6%</strong></span>
            <span>Source: Avantis quarterly</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Compare chart (real CAGE / VEQT / XEQT) ──────────────────────────────────
function toPct(points: { t: number; price: number | null }[]): (number | null)[] {
  const firstValid = points.find((p) => p.price != null)?.price;
  if (firstValid == null) return points.map(() => null);
  return points.map((p) => (p.price == null ? null : (p.price / firstValid - 1) * 100));
}

function linePath(pct: (number | null)[], x: (i: number) => number, y: (v: number) => number): string {
  let d = "";
  let started = false;
  pct.forEach((v, i) => {
    if (v == null) return;
    d += `${started ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
    started = true;
  });
  return d.trim();
}

function CompareChart() {
  const { SERIES, COMPARISONS, RETURNS } = useDataset();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const [show, setShow] = useState({ cage: true, veqt: true, xeqt: true });

  const cage = SERIES.ALL ?? [];
  const veqt = COMPARISONS.find((c) => c.ticker === "VEQT")?.series.ALL ?? [];
  const xeqt = COMPARISONS.find((c) => c.ticker === "XEQT")?.series.ALL ?? [];
  const veqtColor = COMPARISONS.find((c) => c.ticker === "VEQT")?.color ?? "#5f7698";
  const xeqtColor = COMPARISONS.find((c) => c.ticker === "XEQT")?.color ?? "#8f7558";

  const N = cage.length;
  const hasData = N >= 2;

  const series = useMemo(() => {
    if (!hasData) return null;
    const cagePct = toPct(cage);
    const veqtPct = toPct(veqt.length === N ? veqt : cage.map((p) => ({ t: p.t, price: null })));
    const xeqtPct = toPct(xeqt.length === N ? xeqt : cage.map((p) => ({ t: p.t, price: null })));
    return { cage: cagePct, veqt: veqtPct, xeqt: xeqtPct };
  }, [cage, veqt, xeqt, N, hasData]);

  const W = 1000,
    H = 280,
    P = 20;

  if (!hasData || !series) {
    return (
      <section className="compare">
        <div className="sec-head bare">
          <div className="num">03</div>
          <h2>CAGE vs <em>the giants.</em></h2>
          <div className="right">Since inception<br />Total return</div>
        </div>
        <div className="compare-frame">
          <div className="compare-chart" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              Not enough price history yet
            </span>
          </div>
        </div>
      </section>
    );
  }

  const visible: number[] = [];
  (Object.keys(show) as (keyof typeof show)[]).forEach((k) => {
    if (show[k]) series[k].forEach((v) => v != null && visible.push(v));
  });
  const dataMin = Math.min(0, ...visible);
  const dataMax = Math.max(...visible, 1);
  const pad = (dataMax - dataMin) * 0.12 || 1;
  const yMin = dataMin - pad,
    yMax = dataMax + pad;

  const x = (i: number) => P + (i / (N - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - yMin) / (yMax - yMin)) * (H - 2 * P);

  const step = yMax - yMin > 30 ? 10 : 5;
  const grid: number[] = [];
  for (let g = Math.ceil(yMin / step) * step; g <= yMax; g += step) grid.push(g);

  const lines: { key: keyof typeof show; color: string; sw: number }[] = [
    { key: "veqt", color: veqtColor, sw: 1.6 },
    { key: "xeqt", color: xeqtColor, sw: 1.6 },
    { key: "cage", color: "var(--hot)", sw: 2.6 },
  ];

  const endPct = (arr: (number | null)[]) => {
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i] as number;
    return 0;
  };
  const meta = {
    cage: RETURNS.fund.SI,
    veqt: endPct(series.veqt),
    xeqt: endPct(series.xeqt),
  };

  return (
    <section className="compare">
      <div className="sec-head bare">
        <div className="num">03</div>
        <h2>CAGE vs <em>the giants.</em></h2>
        <div className="right">Since inception<br />Total return</div>
      </div>

      <div className="compare-frame">
        <div className="compare-head">
          <h3>Since inception, side-by-side</h3>
          <div className="toggles">
            {(["cage", "veqt", "xeqt"] as const).map((k) => (
              <button key={k} data-key={k} className={`tog${show[k] ? " on" : ""}`} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="compare-chart" ref={ref}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {grid.map((g) => (
              <g key={g}>
                <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="var(--ink)" strokeWidth={g === 0 ? 1 : 0.5} strokeDasharray={g === 0 ? undefined : "3 4"} strokeOpacity={g === 0 ? 0.6 : 0.3} />
                <text x={W - P - 4} y={y(g) - 4} textAnchor="end" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)" letterSpacing="0.06em">{g > 0 ? "+" : ""}{g}%</text>
              </g>
            ))}
            {lines.map((ln, idx) =>
              show[ln.key] ? (
                <path
                  key={ln.key}
                  data-key={ln.key}
                  d={linePath(series[ln.key], x, y)}
                  fill="none"
                  stroke={ln.color}
                  strokeWidth={ln.sw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  style={{ strokeDasharray: 1, strokeDashoffset: inView ? 0 : 1, transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)", transitionDelay: `${idx * 0.14}s` }}
                />
              ) : null
            )}
          </svg>
        </div>
        <div className="compare-meta">
          <div className="cmeta"><span className="sw" style={{ background: "var(--hot)" }} /><span className="nm">CAGE</span><span className="v num">{meta.cage >= 0 ? "+" : ""}{meta.cage.toFixed(2)}%</span></div>
          <div className="cmeta"><span className="sw" style={{ background: veqtColor }} /><span className="nm">VEQT</span><span className="v num">{meta.veqt >= 0 ? "+" : ""}{meta.veqt.toFixed(2)}%</span></div>
          <div className="cmeta"><span className="sw" style={{ background: xeqtColor }} /><span className="nm">XEQT</span><span className="v num">{meta.xeqt >= 0 ? "+" : ""}{meta.xeqt.toFixed(2)}%</span></div>
        </div>
      </div>
    </section>
  );
}

// ─── Factor exposures ─────────────────────────────────────────────────────────
function Factors() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  return (
    <section className="factors-wrap">
      <div className="sec-head bare">
        <div className="num">04</div>
        <h2>The <em>whole point</em> of CAGE.</h2>
        <div className="right">Factor loadings<br />vs ACWI IMI</div>
      </div>
      <div className="factors" ref={ref}>
        <div className="factors-intro">
          <div className="l">The receipts</div>
          <h3>Market-cap weighting is one bet. CAGE is <em>four.</em></h3>
          <p>VEQT and XEQT weight every company by what other investors pay. <strong>CAGE doesn&apos;t.</strong> Avantis scores every stock daily on price, book equity, and cash profitability — then nudges toward names that look cheap and productive.</p>
          <p>The bars are the receipts. Positive numbers mean CAGE owns more of that style than a passive global index would. <strong>The whole investment thesis is in the bars to the right.</strong></p>
        </div>
        <div className="factors-bars">
          {TODAY_FACTORS.map((f) => {
            const w = Math.min(50, Math.abs(f.val) * 100);
            return (
              <div className="factor-row" key={f.nm}>
                <div className="top">
                  <div>
                    <div className="nm"><em>{f.nm}</em></div>
                    <div className="sub">{f.sub}</div>
                  </div>
                  <div className={`val${f.neg ? " neg" : ""}`}>{f.val >= 0 ? "+" : ""}{f.val.toFixed(2)}</div>
                </div>
                <div className="bar">
                  <div className="mid" />
                  <div className={`fill ${f.neg ? "neg" : "pos"}`} style={{ width: inView ? `${w}%` : 0 }} />
                </div>
                <div className="ticks"><span>−0.5</span><span>0</span><span>+0.5</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Holdings search ──────────────────────────────────────────────────────────
function Search() {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const result = useMemo(() => {
    if (!q.trim()) return null;
    const key = q.toUpperCase().trim().split(/\s+/)[0];
    const hit =
      SEARCH_FIXTURES[key] ||
      Object.values(SEARCH_FIXTURES).find((h) => h.name.toLowerCase().includes(q.toLowerCase()));
    return { q, hit };
  }, [q]);

  return (
    <section className="search-wrap">
      <div className="sec-head bare">
        <div className="num">05</div>
        <h2>Look <em>inside.</em></h2>
        <div className="right">Try: AAPL · TD · NVDA<br />/ to focus</div>
      </div>
      <div className="search">
        <div className="l">Holdings lookup · ~9,000 stocks</div>
        <h3>Does CAGE own <em>that</em>?</h3>
        <div className="search-input-wrap">
          <input ref={inputRef} placeholder="any ticker or company…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="kbd">/</span>
        </div>
        <div className="search-result">
          {!result ? (
            <span style={{ color: "var(--ink-3)" }}>Type a ticker — AAPL, TD, NESN, BRK…</span>
          ) : !result.hit ? (
            <>
              <span className="tag">Not in CAGE</span>
              <strong>&ldquo;{result.q}&rdquo;</strong> doesn&apos;t appear in any of the five sleeves at any meaningful weight.
            </>
          ) : (
            <>
              <span className="tag">In {result.hit.sleeve}</span>
              <strong>{result.hit.name}</strong> · effective weight in CAGE: <strong>{result.hit.weight.toFixed(2)}%</strong> · CAGE <strong>{result.hit.signal}</strong>{" "}
              <span style={{ color: "var(--ink-3)" }}>({result.hit.reason}).</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Today() {
  return (
    <>
      <SiteHeader active="today" right={<span className="status-pill"><span className="d" />Open · TSX</span>} />
      <main className="tp-today">
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-left">
              <h1 className="hero-mast">
                Just<span className="hi">Buy</span>
                <br />
                <span className="it">Cage.</span>
              </h1>
              <div className="hero-sub">
                <div className="n">01</div>
                <p>A daily, opinionated read on the only Canadian-listed ETF that <strong>tilts on purpose</strong> — toward cheaper, more profitable companies. Built for investors who can answer <strong>&ldquo;why this and not VEQT?&rdquo;</strong> in one sentence.</p>
              </div>
              <div className="hero-meta">
                <div className="m"><b>NEO:CAGE</b></div>
                <div className="m">CAD</div>
                <div className="m">0.28% MER</div>
                <div className="m">Listed <b>18 Mar 2026</b></div>
                <div className="m">Holdings <b>≈9,000</b></div>
              </div>
              <div className="hero-cta">
                <Link href="/why" className="btn btn-primary">Read the case <span>→</span></Link>
                <Link href="/inside#anatomy" className="btn btn-ghost">See holdings</Link>
              </div>
            </div>
            <PriceSlab />
          </div>
        </section>

        <div className="declaration">
          <div className="inner">
            <div className="l">The whole<br />thesis</div>
            <h3>Market-cap says <em>&ldquo;trust the crowd.&rdquo;</em> CAGE says <em>&ldquo;<strong>trust the math.</strong>&rdquo;</em></h3>
            <div className="mark">—</div>
          </div>
        </div>

        <XRay />
        <CompareChart />
        <Factors />
        <Search />

        <section className="teasers-wrap">
          <div className="sec-head bare">
            <div className="num">06</div>
            <h2>Go <em>deeper.</em></h2>
            <div className="right">The article<br />or the data</div>
          </div>
          <div className="teasers">
            <Link href="/why" className="teaser">
              <div className="l">The Article · 12 min</div>
              <h4>The world&apos;s equities,<br /><em>tilted on purpose.</em></h4>
              <p>Five sections. The philosophy. The daily implementation. The Canadian angle. Head-to-head vs VEQT/XEQT. And the honest answer on who CAGE is actually for — including who should stay away.</p>
              <span className="go">Read →</span>
            </Link>
            <Link href="/inside" className="teaser">
              <div className="l">The Data · all widgets</div>
              <h4>Inside CAGE.<br /><em>Every dollar, every day.</em></h4>
              <p>Rhythm calendar of every session, 3-ring X-Ray with click-to-drill, interactive money-flow Sankey ($1 → 5 sleeves → 6 regions), and the full returns table vs. ACWI IMI.</p>
              <span className="go">Open all →</span>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
