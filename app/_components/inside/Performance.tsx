"use client";

import { useMemo, useRef, useState } from "react";
import { useDataset } from "../overview/dataset";
import { useInView } from "./viz";

const Wd = 1240,
  Hd = 360,
  Pd = 28;

type Key = "cage" | "veqt" | "xeqt" | "acwi";
const HEX: Record<Key, string> = { cage: "#e8281f", veqt: "#506580", xeqt: "#888377", acwi: "#c9c4ba" };
const NAMES: Record<Key, string> = { cage: "CAGE", veqt: "VEQT", xeqt: "XEQT", acwi: "ACWI" };
const PERIODS: { k: string; label: string; n: number }[] = [
  { k: "1w", label: "1W", n: 5 },
  { k: "1m", label: "1M", n: 22 },
  { k: "all", label: "Since launch", n: Infinity },
];
const KEYS: Key[] = ["cage", "veqt", "xeqt", "acwi"];

function prices(points: { t: number; price: number | null }[]): (number | null)[] {
  return points.map((p) => p.price);
}

export function Performance() {
  const { SERIES, COMPARISONS, BENCHMARK, RETURNS } = useDataset();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const [period, setPeriod] = useState("all");
  const [show, setShow] = useState<Record<Key, boolean>>({ cage: true, veqt: true, xeqt: true, acwi: true });
  const [cross, setCross] = useState<{ idx: number; px: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const full = useMemo(() => {
    const cage = prices(SERIES.ALL ?? []);
    const veqt = prices(COMPARISONS.find((c) => c.ticker === "VEQT")?.series.ALL ?? []);
    const xeqt = prices(COMPARISONS.find((c) => c.ticker === "XEQT")?.series.ALL ?? []);
    const acwi = prices(BENCHMARK.ALL ?? []);
    const dates = (SERIES.ALL ?? []).map((p) => new Date(p.t));
    return { cage, veqt, xeqt, acwi, dates };
  }, [SERIES, COMPARISONS, BENCHMARK]);

  const n0 = full.cage.length;
  const hasData = n0 >= 2;

  const win = useMemo(() => {
    const p = PERIODS.find((x) => x.k === period)!;
    const take = (arr: (number | null)[]) => (p.n === Infinity ? arr : arr.slice(-p.n));
    const toPct = (arr: (number | null)[]) => {
      const base = arr.find((v) => v != null);
      if (base == null) return arr.map(() => null);
      return arr.map((v) => (v == null ? null : (v / base - 1) * 100));
    };
    return {
      cage: toPct(take(full.cage)),
      veqt: toPct(take(full.veqt)),
      xeqt: toPct(take(full.xeqt)),
      acwi: toPct(take(full.acwi)),
      dates: p.n === Infinity ? full.dates : full.dates.slice(-p.n),
    };
  }, [full, period]);

  const visible = useMemo(() => KEYS.filter((k) => show[k]), [show]);
  const n = win.cage.length;

  const { x, y, grid, paths, ends, yMin, yMax } = useMemo(() => {
    const vals: number[] = [];
    visible.forEach((k) => win[k].forEach((v) => v != null && vals.push(v)));
    let lo = Math.min(0, ...vals, 0),
      hi = Math.max(0, ...vals, 1);
    const pad = Math.max(1, (hi - lo) * 0.08);
    lo -= pad;
    hi += pad;
    const x = (i: number) => Pd + (i / (n - 1 || 1)) * (Wd - 2 * Pd);
    const y = (v: number) => Hd - Pd - ((v - lo) / (hi - lo)) * (Hd - 2 * Pd);
    const grid: number[] = [];
    for (let v = Math.ceil(lo / 5) * 5; v <= Math.floor(hi / 5) * 5; v += 5) grid.push(v);
    const order: Key[] = (visible.filter((k) => k !== "cage") as Key[]).concat(visible.includes("cage") ? (["cage"] as Key[]) : []);
    const paths = order.map((k) => {
      let d = "",
        started = false;
      win[k].forEach((v, i) => {
        if (v == null) return;
        d += `${started ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
        started = true;
      });
      return { k, d: d.trim(), sw: k === "cage" ? 2.4 : 1.5 };
    });
    const ends = order.map((k) => {
      let last = 0;
      for (let i = win[k].length - 1; i >= 0; i--) if (win[k][i] != null) { last = win[k][i] as number; break; }
      return { k, v: last };
    });
    return { x, y, grid, paths, ends, yMin: lo, yMax: hi };
  }, [visible, win, n]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hasData) return;
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    let idx = Math.round((ratio * Wd - Pd) / (Wd - 2 * Pd) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setCross({ idx, px: (e.clientX - r.left) });
  };

  // returns table — CAGE real, peers labeled static
  const peer = (veqt: string, xeqt: string, acwi: string) => ({ veqt, xeqt, acwi });
  const tbl = {
    "1D": peer("+0.86%", "+0.91%", "+0.92%"),
    "1W": peer("+2.12%", "+2.08%", "+2.04%"),
    "1M": peer("+4.85%", "+4.70%", "+4.78%"),
    SI: peer("+16.30%", "+16.10%", "+16.80%"),
    vol: peer("13.8%", "13.9%", "13.5%"),
    sharpe: peer("1.30", "1.28", "1.34"),
  };
  const cageR = RETURNS.fund;
  const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <section id="performance" className="sec-block">
      <div className="sec-head">
        <div className="num">04</div>
        <h2>The <em>performance.</em></h2>
        <div className="right">CAGE vs<br />VEQT · XEQT · ACWI</div>
      </div>
      <p className="sec-sub">Total return overlay. Pick a window. Toggle series in/out. Below: the same numbers as a table you can scan in five seconds.</p>

      <div className="perf-frame" ref={ref}>
        <div className="perf-controls">
          <div className="periods">
            {PERIODS.map((p) => (
              <button key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.label}</button>
            ))}
          </div>
          <div className="series-toggles">
            {KEYS.map((k) => (
              <button key={k} data-key={k} className={show[k] ? "on" : ""} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}>{NAMES[k]}</button>
            ))}
          </div>
        </div>

        <div className="perf-chart">
          {!hasData ? (
            <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              Not enough price history yet
            </div>
          ) : (
            <>
              <div className="perf-cross" style={{ left: cross ? cross.px : 0, opacity: cross ? 1 : 0 }} />
              <svg ref={svgRef} viewBox={`0 0 ${Wd} ${Hd}`} preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setCross(null)}>
                {grid.map((v) => (
                  <g key={v}>
                    <line x1={Pd} x2={Wd - Pd} y1={y(v)} y2={y(v)} stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 4" />
                    <text x={Wd - Pd - 6} y={y(v) - 4} textAnchor="end" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)" letterSpacing="0.06em">{v >= 0 ? "+" : ""}{v}%</text>
                  </g>
                ))}
                <line x1={Pd} x2={Wd - Pd} y1={y(0)} y2={y(0)} stroke="var(--ink-3)" strokeWidth="0.8" />
                {paths.map((p, idx) => (
                  <path key={p.k} data-key={p.k} d={p.d} fill="none" stroke={HEX[p.k]} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round"
                    pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: inView ? 0 : 1, transition: "stroke-dashoffset 0.95s cubic-bezier(.2,.7,.2,1)", transitionDelay: `${idx * 0.09}s` }} />
                ))}
                {ends.map((e) => (
                  <text key={e.k} x={Wd - Pd - 4} y={y(e.v) + 4} textAnchor="end" fontFamily="var(--display)" fontSize="13" fill={HEX[e.k]} letterSpacing="-0.02em">{e.v >= 0 ? "+" : ""}{e.v.toFixed(2)}%</text>
                ))}
                {cross && (
                  <g>
                    <line x1={x(cross.idx)} x2={x(cross.idx)} y1={Pd} y2={Hd - Pd} stroke="var(--ink-2)" strokeWidth="0.6" strokeDasharray="2 3" />
                    {visible.map((k) => {
                      const v = win[k][cross.idx];
                      return v == null ? null : <circle key={k} className="perf-dot" cx={x(cross.idx)} cy={y(v)} r="4" stroke={HEX[k]} />;
                    })}
                  </g>
                )}
              </svg>
              {cross && (
                <div className="perf-tip" style={{ opacity: 1, left: Math.max(90, Math.min((ref.current?.clientWidth ?? 600) - 90, cross.px)), top: 34 }}>
                  <div className="date">{win.dates[cross.idx]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · session {cross.idx + 1}/{n}</div>
                  {visible.slice().reverse().map((k) => {
                    const v = win[k][cross.idx];
                    return (
                      <div className="row" key={k}>
                        <span className="nm"><span className="sw" style={{ background: HEX[k] }} />{NAMES[k]}</span>
                        <b>{v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`}</b>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="perf-table">
          <div className="pth">
            <div />
            <div className="r">1D</div>
            <div className="r">1W</div>
            <div className="r">1M</div>
            <div className="r">Since launch</div>
            <div className="r">Vol 30d</div>
            <div className="r">Sharpe</div>
          </div>
          <div className="ptrow on">
            <div className="lbl"><span className="sw" style={{ background: "var(--hot)" }} /><b>CAGE</b><span className="t">Avantis CIBC</span></div>
            <div className={`r ${cageR["1D"] >= 0 ? "gain" : "loss"}`}>{fmt(cageR["1D"])}</div>
            <div className={`r ${cageR["1W"] >= 0 ? "gain" : "loss"}`}>{fmt(cageR["1W"])}</div>
            <div className={`r ${cageR["1M"] >= 0 ? "gain" : "loss"}`}>{fmt(cageR["1M"])}</div>
            <div className={`r big ${cageR.SI >= 0 ? "gain" : "loss"}`}>{fmt(cageR.SI)}</div>
            <div className="r">14.2%</div>
            <div className="r">1.42</div>
          </div>
          {(["veqt", "xeqt", "acwi"] as const).map((k) => (
            <div className="ptrow" key={k}>
              <div className="lbl"><span className="sw" style={{ background: HEX[k] }} /><b>{NAMES[k]}{k === "acwi" ? " IMI" : ""}</b><span className="t">{k === "veqt" ? "Vanguard" : k === "xeqt" ? "iShares" : "Benchmark"}</span></div>
              <div className="r gain">{tbl["1D"][k]}</div>
              <div className="r gain">{tbl["1W"][k]}</div>
              <div className="r gain">{tbl["1M"][k]}</div>
              <div className="r gain big">{tbl.SI[k]}</div>
              <div className="r">{tbl.vol[k]}</div>
              <div className="r">{tbl.sharpe[k]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
