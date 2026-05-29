"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useDataset } from "../overview/dataset";
import { SIB_PALETTE } from "../overview/data";
import { SLEEVE_SHORT, INSIDE_HOLDINGS } from "./inside.data";
import { arc, sparkPath, useInView, TAU } from "./viz";

type SortKey = "nm" | "tk" | "sleeve" | "wt" | "ch";

export function Anatomy() {
  const { SIBLINGS } = useDataset();
  const { ref, inView } = useInView<SVGSVGElement>(0.2);
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("wt");
  const [sortDir, setSortDir] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);

  const sleeves = useMemo(
    () =>
      SIBLINGS.map((s) => ({
        t: s.ticker,
        color: SIB_PALETTE[s.color],
        weight: s.weight,
        day: s.dayChangePct,
      })),
    [SIBLINGS]
  );

  const { sleeveArcs, leafArcs } = useMemo(() => {
    const sleeveArcs: { t: string; d: string; color: string; lx: number; ly: number; mid: number; w: number; show: boolean }[] = [];
    const leafArcs: { t: string; d: string; color: string; alpha: number; mid: number; key: string }[] = [];
    const sub = [0.28, 0.22, 0.18, 0.14, 0.1, 0.08];
    let acc = 0;
    for (const s of sleeves) {
      const a0 = acc,
        a1 = acc + s.weight * TAU;
      acc = a1;
      const mid = (a0 + a1) / 2;
      sleeveArcs.push({ t: s.t, d: arc(a0, a1, 44, 124), color: s.color, lx: +(Math.sin(mid) * 80).toFixed(2), ly: +(-Math.cos(mid) * 80).toFixed(2), mid, w: s.weight, show: s.weight > 0.07 });
      let aacc = a0;
      sub.forEach((p, i) => {
        const sa0 = aacc,
          sa1 = aacc + (a1 - a0) * p;
        aacc = sa1;
        leafArcs.push({ t: s.t, d: arc(sa0, sa1, 128, 178), color: s.color, alpha: 0.85 - i * 0.1, mid, key: `${s.t}-${i}` });
      });
    }
    return { sleeveArcs, leafArcs };
  }, [sleeves]);

  const explode = (mid: number, t: string) =>
    active && t === active ? `translate(${(Math.sin(mid) * 16).toFixed(1)}px, ${(-Math.cos(mid) * 16).toFixed(1)}px)` : undefined;

  const rows = useMemo(() => {
    let list = INSIDE_HOLDINGS.slice();
    if (active) list = list.filter((h) => h.sleeve === active);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((h) => h.nm.toLowerCase().includes(q) || h.tk.toLowerCase().includes(q));
    list.sort((a, b) => {
      const av = a[sortKey],
        bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
      return ("" + av).localeCompare("" + bv) * sortDir;
    });
    return list;
  }, [active, query, sortKey, sortDir]);

  const colorOf = (sleeve: string) => sleeves.find((s) => s.t === sleeve)?.color ?? "var(--ink-3)";

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(key === "wt" || key === "ch" ? -1 : 1);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filterReadout = active
    ? `${active} · ${SLEEVE_SHORT[active]?.name} · ${rows.length} of ${INSIDE_HOLDINGS.filter((h) => h.sleeve === active).length}`
    : query.trim()
    ? `Search "${query.trim()}" · ${rows.length} match${rows.length === 1 ? "" : "es"}`
    : `All sleeves · showing ${rows.length}`;

  return (
    <section id="anatomy" className="sec-block">
      <div className="sec-head">
        <div className="num">02</div>
        <h2>The <em>anatomy.</em></h2>
        <div className="right">~9,000 holdings<br />top 40 below</div>
      </div>
      <p className="sec-sub">CAGE is a fund of five Avantis funds. Five sleeves, ~9,000 underlying stocks. Click a sleeve to filter. Search names or tickers. Sort columns.</p>

      <div className="anat-grid">
        <div className="anat-sun">
          <svg ref={ref} id="ic-sunburst" className={inView ? "spin-in" : undefined} viewBox="-220 -220 440 440">
            <circle cx="0" cy="0" r="40" fill="var(--bg)" stroke="var(--ink)" strokeWidth="2" data-reset="1" style={{ cursor: "pointer" }} onClick={() => setActive(null)} />
            <text x="0" y="-3" textAnchor="middle" fontFamily="var(--display)" fontSize="22" fill="var(--ink)" letterSpacing="-0.04em" pointerEvents="none">CAGE</text>
            <text x="0" y="13" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--hot)" letterSpacing="0.18em" pointerEvents="none">100%</text>
            {leafArcs.map((l) => (
              <path key={l.key} className="sb-leaf" d={l.d} fill={l.color} fillOpacity={active == null ? l.alpha : l.t === active ? 0.9 : 0.15} stroke="var(--bg)" strokeWidth="1" pointerEvents="none" style={{ transform: explode(l.mid, l.t) }} />
            ))}
            {sleeveArcs.map((s) => (
              <g key={s.t}>
                <path className="sb-sleeve" d={s.d} fill={s.color} fillOpacity={active == null ? 1 : s.t === active ? 1 : 0.4} stroke="var(--bg)" strokeWidth="2" style={{ cursor: "pointer", transform: explode(s.mid, s.t) }} onClick={() => setActive(s.t === active ? null : s.t)} />
                {s.show && (
                  <g style={{ transform: explode(s.mid, s.t) }} pointerEvents="none">
                    <text x={s.lx} y={s.ly - 3} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--bg)" letterSpacing="0.1em" fontWeight="700">{s.t}</text>
                    <text x={s.lx} y={s.ly + 11} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--display)" fontSize="13" fill="var(--bg)">{(s.w * 100).toFixed(1)}%</text>
                  </g>
                )}
              </g>
            ))}
            <circle cx="0" cy="0" r="182" fill="none" stroke="var(--line-strong)" strokeWidth="0.6" strokeDasharray="3 4" />
          </svg>

          <div className="anat-legend">
            {sleeves.map((s) => (
              <div key={s.t} className={`anat-srow${active === s.t ? " active" : ""}`} onClick={() => setActive(s.t === active ? null : s.t)}>
                <span className="sw" style={{ background: s.color }} />
                <span className="n">{SLEEVE_SHORT[s.t]?.name ?? s.t}<span className="t">{s.t} · {SLEEVE_SHORT[s.t]?.region}</span></span>
                <span className="w num">{(s.weight * 100).toFixed(1)}%</span>
                <span className={`ch ${s.day >= 0 ? "gain" : "loss"} num`}>{s.day >= 0 ? "+" : ""}{s.day.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="anat-table">
          <div className="at-search">
            <span className="lbl">Search holdings</span>
            <div className="wrap">
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none"><circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.8" /><path d="M14 14L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input ref={searchRef} placeholder="AAPL · TD · Nestlé · Tencent…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
              <span className="kbd">/</span>
            </div>
            <div className="at-filter">
              <span className="label">Filter</span>
              <span className="val">{filterReadout}</span>
              <span className={`reset${active || query.trim() ? " on" : ""}`} onClick={() => { setActive(null); setQuery(""); }}>Clear ✕</span>
            </div>
          </div>

          <div className="at-head">
            <div />
            <div onClick={() => onSort("nm")}>Holding ↕</div>
            <div className="r" onClick={() => onSort("tk")}>Ticker</div>
            <div className="r" onClick={() => onSort("sleeve")}>Sleeve</div>
            <div className="r" onClick={() => onSort("wt")}>Weight ↕</div>
            <div className="r" onClick={() => onSort("ch")}>Day ↕</div>
            <div className="r">30d</div>
          </div>
          <div className="at-tbody">
            {rows.map((h, i) => (
              <div className="at-trow" key={h.tk} style={{ animationDelay: `${i * 8}ms` }}>
                <span className="sw" style={{ background: colorOf(h.sleeve) }} />
                <div><div className="nm">{h.nm}<span className="role">{h.role}</span></div></div>
                <div className="tk">{h.tk}</div>
                <div className="sl">{h.sleeve}</div>
                <div className="wt num">{h.wt.toFixed(2)}%</div>
                <div className={`ch ${h.ch >= 0 ? "gain" : "loss"} num`}>{h.ch >= 0 ? "+" : ""}{h.ch.toFixed(2)}%</div>
                <div className="sp"><svg viewBox="0 0 52 18" preserveAspectRatio="none"><path d={sparkPath(i, h.ch)} fill="none" stroke={h.ch >= 0 ? "var(--gain)" : "var(--loss)"} strokeWidth="1.3" /></svg></div>
              </div>
            ))}
          </div>
          <div className="at-foot">
            <span><strong>{rows.length}</strong> of <b>~9,000</b> · the long tail (<b>88.6%</b>) sits below 0.30%</span>
            <span>Source: Avantis quarterly · cross-walked to CIBC fund-of-funds</span>
          </div>
        </div>
      </div>
    </section>
  );
}
