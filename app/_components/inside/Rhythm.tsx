"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDataset } from "../overview/dataset";
import type { Bar } from "../overview/data";

type Session = { i: number; date: Date; r: number; vol: string; carrier: string };

function bucket(r: number): string {
  if (r >= 1.5) return "up-3";
  if (r >= 0.6) return "up-2";
  if (r >= 0.2) return "up-1";
  if (r >= 0) return "up-0";
  if (r >= -0.2) return "dn-0";
  if (r >= -0.6) return "dn-1";
  if (r >= -1.5) return "dn-2";
  return "dn-3";
}

function retMap(bars: Bar[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 1; i < bars.length; i++) {
    m.set(bars[i].date, (bars[i].close - bars[i - 1].close) / bars[i - 1].close);
  }
  return m;
}

export function Rhythm() {
  const { CAGE_BARS, SIBLING_BARS, SIBLINGS } = useDataset();
  const gridRef = useRef<HTMLDivElement>(null);

  const { days, cumSeries, upCount, dnCount, best, worst } = useMemo(() => {
    const bars = CAGE_BARS;
    if (bars.length < 2) {
      return { days: [] as Session[], cumSeries: [] as number[], upCount: 0, dnCount: 0, best: 0, worst: 0 };
    }
    const meanVol = bars.reduce((s, b) => s + b.volume, 0) / bars.length || 1;
    const sibMaps = SIBLINGS.map((s) => ({ t: s.ticker, map: retMap(SIBLING_BARS[s.ticker] ?? []) }));

    const all: Session[] = [];
    for (let i = 1; i < bars.length; i++) {
      const r = ((bars[i].close - bars[i - 1].close) / bars[i - 1].close) * 100;
      let carrier = "—";
      let bestRet = -Infinity;
      for (const sm of sibMaps) {
        const sr = sm.map.get(bars[i].date);
        if (sr != null && sr > bestRet) {
          bestRet = sr;
          carrier = sm.t;
        }
      }
      all.push({ i: 0, date: new Date(bars[i].t), r, vol: (bars[i].volume / meanVol).toFixed(2), carrier });
    }
    const sliced = all.slice(-50).map((d, i) => ({ ...d, i }));

    let cum = 100;
    const cumSeries = sliced.map((d) => {
      cum *= 1 + d.r / 100;
      return cum - 100;
    });

    let upCount = 0,
      dnCount = 0,
      best = sliced[0].r,
      worst = sliced[0].r;
    sliced.forEach((d) => {
      if (d.r >= 0) upCount++;
      else dnCount++;
      if (d.r > best) best = d.r;
      if (d.r < worst) worst = d.r;
    });
    return { days: sliced, cumSeries, upCount, dnCount, best, worst };
  }, [CAGE_BARS, SIBLING_BARS, SIBLINGS]);

  const n = days.length;
  const lastIdx = n - 1;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dim, setDim] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [cols, setCols] = useState(12);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (n > 0) setIdx(n - 1);
  }, [n]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => setCols(Math.max(1, Math.round(el.clientWidth / 44)));
    measure();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { threshold: 0.15 }
    );
    io.observe(el);
    const raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) && r.bottom > 0) setInView(true);
    });
    window.addEventListener("resize", measure);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [n]);

  useEffect(() => {
    if (!inView) return;
    const id = setTimeout(() => setRevealed(true), 1600);
    return () => clearTimeout(id);
  }, [inView]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIdx((p) => Math.min(lastIdx, p + 1)), 80);
    return () => clearInterval(id);
  }, [playing, lastIdx]);
  useEffect(() => {
    if (playing && idx >= lastIdx) {
      setPlaying(false);
      setDim(false);
    }
  }, [playing, idx, lastIdx]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      setDim(false);
      return;
    }
    setIdx(0);
    setDim(true);
    setPlaying(true);
  };
  const onScrub = (v: number) => {
    setPlaying(false);
    setIdx(v);
    setDim(v < lastIdx);
  };
  const clickCell = (i: number) => {
    setPlaying(false);
    setDim(false);
    setIdx(i);
  };

  const streak = useMemo(() => {
    if (hoverIdx == null || playing || !days.length) return null;
    const s = days[hoverIdx].r >= 0 ? 1 : -1;
    let lo = hoverIdx,
      hi = hoverIdx;
    while (lo - 1 >= 0 && (days[lo - 1].r >= 0 ? 1 : -1) === s) lo--;
    while (hi + 1 < n && (days[hi + 1].r >= 0 ? 1 : -1) === s) hi++;
    return [lo, hi] as const;
  }, [hoverIdx, playing, days, n]);

  if (n < 2) {
    return (
      <section id="rhythm" className="sec-block">
        <div className="sec-head"><div className="num">01</div><h2>The <em>rhythm.</em></h2><div className="right">Every session</div></div>
        <div className="rhythm-frame" style={{ padding: "48px 22px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          Not enough trading history yet
        </div>
      </section>
    );
  }

  const detailIdx = hoverIdx != null && !playing ? hoverIdx : idx;
  const detail = days[detailIdx];
  const detailCum = cumSeries[detailIdx] ?? 0;
  const tag = detailIdx === lastIdx ? "Today · the leader" : detail.r === best ? "Best session" : detail.r === worst ? "Worst session" : hoverIdx != null && !playing ? "Hovered" : "Pinned";

  const JW = 1000,
    JH = 96,
    JP = 14;
  const cmin = Math.min(0, ...cumSeries);
  const cmax = Math.max(0, ...cumSeries);
  const jx = (i: number) => JP + (i / (n - 1 || 1)) * (JW - 2 * JP);
  const jy = (v: number) => JH - JP - ((v - cmin) / (cmax - cmin || 1)) * (JH - 2 * JP);
  const fullLine = cumSeries.map((v, i) => `${i === 0 ? "M" : "L"} ${jx(i).toFixed(1)} ${jy(v).toFixed(1)}`).join(" ");
  const frac = n <= 1 ? 1 : idx / (n - 1);
  const cumNow = cumSeries[idx] ?? 0;
  const journeyUp = cumNow >= 0;

  return (
    <section id="rhythm" className="sec-block">
      <div className="sec-head">
        <div className="num">01</div>
        <h2>The <em>rhythm.</em></h2>
        <div className="right">Every session<br />since 18 Mar</div>
      </div>
      <p className="sec-sub">Each square is one trading day. Up days lean green, down days red — saturation tracks magnitude. Hover for the day. Click to pin the read.</p>

      <div className="rhythm-frame">
        <div className="rhythm-scale">
          <span>−2%</span>
          <span className="dot dot-loss-2" />
          <span className="dot dot-loss-1" />
          <span className="dot dot-flat" />
          <span className="dot dot-gain-1" />
          <span className="dot dot-gain-2" />
          <span>+2%</span>
          <span className="div" />
          <span className="meta">{n} sessions · <b>{upCount}</b> up · <b>{dnCount}</b> down · best <b>+{best.toFixed(1)}%</b> · worst <b>{worst.toFixed(1)}%</b></span>
        </div>

        <div className="rhythm-journey">
          <div className="rj-cap">Cumulative return · the quarter&apos;s path</div>
          <div className={`rj-val${journeyUp ? "" : " loss"}`}>{journeyUp ? "+" : ""}{cumNow.toFixed(2)}%</div>
          <svg viewBox="0 0 1000 96" preserveAspectRatio="none">
            <line x1={JP} x2={JW - JP} y1={jy(0)} y2={jy(0)} stroke="var(--ink-4)" strokeWidth="0.6" strokeDasharray="2 4" />
            <path d={fullLine} fill="none" stroke="var(--ink-4)" strokeWidth="1.4" />
            <path d={fullLine} fill="none" stroke={journeyUp ? "var(--gain)" : "var(--loss)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - frac }} />
            <circle r="4.5" fill="var(--bg)" stroke={journeyUp ? "var(--gain)" : "var(--loss)"} strokeWidth="2.5" cx={jx(idx)} cy={jy(cumNow)} />
          </svg>
        </div>

        <div className="rhythm-player">
          <button className={`rp-play${playing ? " playing" : ""}`} onClick={togglePlay}>
            <span className="ico" />
            {playing ? "Pause" : "Play the quarter"}
          </button>
          <input type="range" className="rp-scrub" min={0} max={lastIdx} value={idx} onChange={(e) => onScrub(+e.target.value)} />
          <div className="rp-progress">Session <b>{idx + 1}</b> / {n}</div>
        </div>

        <div className={`rhythm-grid${inView ? " lit" : ""}`} ref={gridRef}>
          {days.map((d) => {
            const i = d.i;
            const cls = [
              "rcell",
              bucket(d.r),
              dim && i === idx ? "playhead" : "",
              dim && i > idx ? "dimmed" : "",
              !dim && i === idx ? "pinned" : "",
              streak && i >= streak[0] && i <= streak[1] ? "streak-on" : "",
            ].filter(Boolean).join(" ");
            const delay = inView && !revealed ? `${(Math.floor(i / cols) + (i % cols)) * 32}ms` : undefined;
            return (
              <div
                key={i}
                className={cls}
                style={{ transitionDelay: delay }}
                title={`${d.date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} · ${d.r >= 0 ? "+" : ""}${d.r.toFixed(2)}%`}
                onMouseEnter={() => !playing && setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => clickCell(i)}
              >
                <span className="lbl">{d.date.getDate()}</span>
              </div>
            );
          })}
        </div>

        <div className="rhythm-detail">
          <div className="rd-l">
            <div className="rd-day">{detail.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
            <div className="rd-tag">{tag}</div>
          </div>
          <div className="rd-r">
            <div className="rd-stat"><div className="l">Return</div><div className={`v ${detail.r >= 0 ? "gain" : "loss"}`}>{detail.r >= 0 ? "+" : ""}{detail.r.toFixed(2)}%</div></div>
            <div className="rd-stat"><div className="l">Volume</div><div className="v">{detail.vol}×</div></div>
            <div className="rd-stat"><div className="l">Carried by</div><div className="v">{detail.carrier}</div></div>
            <div className="rd-stat"><div className="l">Cumulative</div><div className={`v ${detailCum >= 0 ? "gain" : "loss"}`}>{detailCum >= 0 ? "+" : ""}{detailCum.toFixed(1)}%</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
