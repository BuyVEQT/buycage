"use client";

import { useMemo } from "react";
import { useDataset } from "../overview/dataset";
import { SiteHeader } from "../chrome/SiteHeader";
import { SiteFooter } from "../chrome/SiteFooter";
import { useCountUp, useInView } from "./viz";
import { Rhythm } from "./Rhythm";
import { Anatomy } from "./Anatomy";
import { Flow } from "./Flow";
import { Performance } from "./Performance";
import "./inside.css";

const INCEPTION = new Date("2026-03-18");

function heroSparkPaths(seed: number) {
  const W = 200,
    H = 18,
    N = 24;
  let v = 0;
  const pts: number[] = [];
  for (let k = 0; k < N; k++) {
    v += Math.sin(k * (0.6 + seed * 0.17)) * 0.4 + 0.32 + Math.cos(k * 0.4 + seed) * 0.2;
    pts.push(v);
  }
  const min = Math.min(...pts),
    max = Math.max(...pts),
    dy = max - min || 1;
  const X = (i: number) => (i / (N - 1)) * W;
  const Y = (vv: number) => H - 1 - ((vv - min) / dy) * (H - 2);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  // Round the trig-derived endpoint dot: Math.sin/cos differ in the last ULP
  // across the SSR/client engines, which would trip hydration on cx/cy.
  return { line, area, cx: +X(N - 1).toFixed(1), cy: +Y(pts[N - 1]).toFixed(1) };
}

function HeroStat({
  label,
  value,
  prefix = "",
  suffix = "",
  isInt = false,
  sub,
  seed,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  isInt?: boolean;
  sub: React.ReactNode;
  seed: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const v = useCountUp(value, 1200, true);
  const formatted = isInt
    ? Math.round(v).toLocaleString()
    : v.toFixed(value < 100 ? 2 : 1);
  const { line, area, cx, cy } = useMemo(() => heroSparkPaths(seed), [seed]);

  return (
    <div className="bs" ref={ref}>
      <div className="l">{label}</div>
      <div className="v num">{prefix}{formatted}{suffix}</div>
      <div className="s">{sub}</div>
      <svg className="spark" viewBox="0 0 200 18" preserveAspectRatio="none">
        <path className="area" d={area} />
        <path className="line" d={line} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: inView ? 0 : 1, transition: "stroke-dashoffset 0.9s cubic-bezier(.2,.7,.2,1)" }} />
        <circle r="2.4" cx={cx} cy={cy} style={{ opacity: inView ? 1 : 0, transition: "opacity 0.3s ease 0.6s" }} />
      </svg>
    </div>
  );
}

export default function Inside() {
  const { RETURNS, PRICE, CAGE_BARS, CAGE_META, fetchedAt } = useDataset();
  const sessions = Math.max(CAGE_BARS.length, 0);
  // Derive from fetchedAt, never Date.now(): this component SSRs now, and a
  // render-time clock would differ between server and client (hydration).
  const asOf = fetchedAt ? new Date(fetchedAt) : null;
  const daysListed = Math.max(1, Math.round(((asOf ?? INCEPTION).getTime() - INCEPTION.getTime()) / 86400000));
  const aumM = PRICE.aum > 0 ? PRICE.aum / 1_000_000 : 0;
  const refresh = asOf
    ? asOf.toLocaleString("en-CA", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <>
      <SiteHeader active="inside" right={<span className="status-pill"><span className="d" />Open · TSX</span>} />
      <main className="tp-inside">
        <section className="ic-hero">
          <div className="ic-hero-inner">
            <div className="ic-hero-l">
              <div className="ic-eyebrow"><span className="dot" />Live data · {daysListed} days listed</div>
              <h1 className="ic-h1">INSIDE <em>CAGE.</em></h1>
              <p className="ic-lede">Every dollar, every day. <strong>{sessions || "—"} trading sessions</strong> since CAGE listed on 18 March 2026 — <strong>~9,000 stocks</strong> across five Avantis sleeves, all of it on this page. Most things are clickable.</p>
              <nav className="ic-nav">
                <a href="#rhythm"><span className="n">01</span>Rhythm</a>
                <a href="#anatomy"><span className="n">02</span>Anatomy</a>
                <a href="#flow"><span className="n">03</span>Flow</a>
                <a href="#performance"><span className="n">04</span>Performance</a>
                <a href="#method"><span className="n">05</span>Method</a>
              </nav>
            </div>
            <div className="ic-hero-r">
              <div className="ic-bigstats">
                <HeroStat label="Total return" value={RETURNS.fund.SI} prefix="+" suffix="%" sub={<>vs ACWI IMI <b>+16.8%</b></>} seed={1} />
                <HeroStat label="Holdings" value={9120} isInt sub={<>across <b>5 sleeves</b></>} seed={2} />
                <HeroStat label="AUM" value={aumM} prefix="$" suffix="M" sub={<>grew <b>3.8×</b> since launch</>} seed={3} />
                <HeroStat label="MER" value={CAGE_META.mer * 100} suffix="%" sub={<>vs VEQT <b>0.24%</b></>} seed={4} />
              </div>
            </div>
          </div>
        </section>

        <Rhythm />
        <Anatomy />
        <Flow />
        <Performance />

        <section id="method" className="sec-block">
          <div className="sec-head">
            <div className="num">05</div>
            <h2>The <em>method.</em></h2>
            <div className="right">Footnotes ·<br />not advice</div>
          </div>
          <div className="method-grid">
            <div className="mtile">
              <div className="t">Data</div>
              <p>Daily closes from <b>Yahoo Finance</b>. Holdings + factor loadings from <b>Avantis quarterly fact sheets</b>, cross-walked to CIBC&apos;s fund-of-funds wrapper.</p>
            </div>
            <div className="mtile">
              <div className="t">Contribution</div>
              <p>Sleeve contribution to a day&apos;s move = <b>sleeve weight × sleeve return</b>. Components sum to within ±0.01 pp of CAGE&apos;s daily total return.</p>
            </div>
            <div className="mtile">
              <div className="t">Factor scores</div>
              <p>Loadings normalised to <b>ACWI IMI = 0.00</b>. A loading of +0.42 means CAGE owns ~42% more of that style than a passive global index would.</p>
            </div>
            <div className="mtile">
              <div className="t">Returns</div>
              <p>Total return, net of <b>0.28% MER</b>, reinvested distributions. Since-launch window starts <b>18 Mar 2026</b> — a short window; treat with skepticism.</p>
            </div>
            <div className="mtile">
              <div className="t">Not advice</div>
              <p>BuyCage is independent and editorial. We&apos;re not affiliated with CIBC, Avantis, or any sleeve issuer. <b>Nothing here is investment advice.</b> Talk to a fiduciary.</p>
            </div>
            <div className="mtile">
              <div className="t">Last refresh</div>
              <p><b>{refresh ? `${refresh} ET.` : "Awaiting first data refresh."}</b> Prices live during market hours; holdings refresh quarterly. Real Yahoo data — empty timeframes grey out.</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter
        left="© 2026 BuyCage · Not investment advice · Independent · Real Yahoo data"
        right={<>v2.0 · buycage.ca</>}
      />
    </>
  );
}
