"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../chrome/SiteHeader";
import { SiteFooter } from "../chrome/SiteFooter";
import { useInView } from "../inside/viz";
import {
  BUBBLE_COMPANIES,
  REGION_COLOR,
  RACE_SERIES,
  FACTOR_DIALS,
  H2H_COLS,
  H2H_NAMES,
  H2H_ROWS,
  type Region,
} from "../editorial";
import "./why.css";

type Scene = "shelf" | "bubbles" | "race";
const STEPS: { scene: Scene; mode: "" | "cap" | "tilt" }[] = [
  { scene: "shelf", mode: "" },
  { scene: "bubbles", mode: "cap" },
  { scene: "bubbles", mode: "tilt" },
  { scene: "race", mode: "" },
];

// ─── Read-progress bar ────────────────────────────────────────────────────────
function ReadProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setW(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="read-progress" style={{ width: `${w}%` }} />;
}

// ─── Bubble pack (market-cap → CAGE-tilt morph) ───────────────────────────────
type BubNode = { i: number; x: number; y: number; rCap: number; rTilt: number; rPack: number; popOrder: number; big: boolean; region: Region; tk: string };

function packBubbles(): BubNode[] {
  const W = 600,
    H = 600,
    PAD = 14;
  const rOf = (w: number) => 7 + Math.sqrt(w) * 30;
  const nodes: BubNode[] = BUBBLE_COMPANIES.map((c, i) => {
    const rCap = rOf(c.cap),
      rTilt = rOf(c.tilt);
    return { i, x: W / 2, y: H / 2, rCap, rTilt, rPack: Math.max(rCap, rTilt), popOrder: 0, big: false, region: c.region, tk: c.tk };
  });
  const order = nodes.slice().sort((a, b) => b.rPack - a.rPack);
  const GA = Math.PI * (3 - Math.sqrt(5));
  order.forEach((n, k) => {
    const rad = 12 + Math.sqrt(k) * 46;
    const ang = k * GA;
    n.x = W / 2 + Math.cos(ang) * rad;
    n.y = H / 2 + Math.sin(ang) * rad;
  });
  for (let iter = 0; iter < 240; iter++) {
    for (let a = 0; a < nodes.length; a++) {
      const na = nodes[a];
      na.x += (W / 2 - na.x) * 0.008;
      na.y += (H / 2 - na.y) * 0.008;
      for (let b = a + 1; b < nodes.length; b++) {
        const nb = nodes[b];
        const dx = nb.x - na.x,
          dy = nb.y - na.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const min = na.rPack + nb.rPack + 3;
        if (d < min) {
          const push = (min - d) / 2,
            ux = dx / d,
            uy = dy / d;
          na.x -= ux * push;
          na.y -= uy * push;
          nb.x += ux * push;
          nb.y += uy * push;
        }
      }
      na.x = Math.max(na.rPack + PAD, Math.min(W - na.rPack - PAD, na.x));
      na.y = Math.max(na.rPack + PAD, Math.min(H - na.rPack - PAD, na.y));
    }
  }
  const cx = 300,
    cy = 300;
  const byDist = nodes.slice().sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
  byDist.forEach((n, k) => (n.popOrder = k));
  nodes.forEach((n) => (n.big = n.rPack > 26));
  return nodes;
}

function Bubbles({ mode }: { mode: "" | "cap" | "tilt" | null }) {
  const nodes = useMemo(() => packBubbles(), []);
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const textRefs = useRef<(SVGTextElement | null)[]>([]);
  const prevMode = useRef<string | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!mode) return;
    const firstPop = prevMode.current === null;
    prevMode.current = mode;
    const targets = nodes.map((n) => (mode === "tilt" ? n.rTilt : n.rCap));
    const start = nodes.map((_, i) => parseFloat(circleRefs.current[i]?.getAttribute("r") || "0"));
    const t0 = performance.now(),
      dur = firstPop ? 560 : 750;
    const stagPer = firstPop ? 16 : 7;
    const maxStag = stagPer * (nodes.length - 1);
    const backOut = (t: number) => {
      const c = 1.9,
        u = t - 1;
      return 1 + (c + 1) * u * u * u + c * u * u;
    };
    const ease = (t: number) => (firstPop ? backOut(t) : 1 - Math.pow(1 - t, 3));
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const elapsed = now - t0;
      nodes.forEach((n, i) => {
        const delay = (firstPop ? n.popOrder : i) * stagPer;
        const lt = Math.max(0, Math.min(1, (elapsed - delay) / dur));
        const k = ease(lt);
        const r = start[i] + (targets[i] - start[i]) * k;
        const el = circleRefs.current[i];
        if (el) {
          el.setAttribute("r", Math.max(0, r).toFixed(2));
          if (mode === "tilt") {
            const grew = n.rTilt >= n.rCap;
            el.setAttribute("fill-opacity", grew ? "0.95" : "0.28");
            el.setAttribute("stroke", grew ? "var(--hot)" : "var(--bg)");
            el.setAttribute("stroke-width", grew ? "2" : "1.5");
          } else {
            el.setAttribute("fill-opacity", "0.9");
            el.setAttribute("stroke", "var(--bg)");
            el.setAttribute("stroke-width", "1.5");
          }
        }
        const tx = textRefs.current[i];
        if (tx) tx.setAttribute("opacity", lt > 0.55 ? "1" : "0");
      });
      if (elapsed < dur + maxStag) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, nodes]);

  return (
    <div className="bubbles">
      <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
        {nodes.map((n) => (
          <g className="bub" key={n.i} transform={`translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`}>
            <circle ref={(el) => { circleRefs.current[n.i] = el; }} r={0} fill={REGION_COLOR[n.region]} fillOpacity={0.9} stroke="var(--bg)" strokeWidth={1.5} />
            {n.big && (
              <text ref={(el) => { textRefs.current[n.i] = el; }} textAnchor="middle" dy="0.32em" fontSize={Math.min(13, n.rPack / 2.4).toFixed(0)} fontWeight="700" opacity={0}>
                {n.tk}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── $1 factor-growth race ────────────────────────────────────────────────────
function Race({ active }: { active: boolean }) {
  const W = 640,
    H = 560,
    PL = 16,
    PR = 92,
    PT = 28,
    PB = 30,
    YEARS = 50;
  const series = useMemo(
    () => RACE_SERIES.map((s) => ({ ...s, pts: Array.from({ length: YEARS + 1 }, (_, y) => Math.pow(1 + s.cagr, y)) })),
    []
  );
  const maxV = Math.max(...series.flatMap((s) => s.pts));
  const x = (y: number) => PL + (y / YEARS) * (W - PL - PR);
  const ly = (v: number) => {
    const lo = Math.log10(1),
      hi = Math.log10(maxV);
    return H - PB - ((Math.log10(v) - lo) / (hi - lo)) * (H - PT - PB);
  };

  return (
    <div className="race">
      <div className="ttl">$1 invested · 50-yr horizon · illustrative long-run premia</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[1, 10, 100, 500].map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={ly(v)} y2={ly(v)} stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 4" />
            <text x={PL} y={ly(v) - 5} fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)">${v}</text>
          </g>
        ))}
        {series.map((s, i) => {
          const d = s.pts.map((v, y) => `${y === 0 ? "M" : "L"} ${x(y).toFixed(1)} ${ly(v).toFixed(1)}`).join(" ");
          const endY = ly(s.pts[YEARS]);
          const mult = Math.round(s.pts[YEARS]);
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={s.key === "scv" ? 2.6 : 1.6} strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: active ? 0 : 1, transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)", transitionDelay: `${i * 0.12}s` }} />
              <circle cx={x(YEARS).toFixed(1)} cy={endY.toFixed(1)} r="3.5" fill={s.color} opacity={active ? 1 : 0} style={{ transition: "opacity 0.3s ease", transitionDelay: `${0.8 + i * 0.12}s` }} />
              <text x={(W - PR + 7).toFixed(1)} y={(endY - 3).toFixed(1)} fontFamily="var(--display)" fontSize="13" fill={s.color} letterSpacing="-0.02em">×{mult}</text>
              <text x={(W - PR + 7).toFixed(1)} y={(endY + 10).toFixed(1)} fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)" letterSpacing="0.04em">{s.nm.toUpperCase()}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Scrollytelling controller ────────────────────────────────────────────────
function Scrolly() {
  const [active, setActive] = useState(0);
  const [bubbleMode, setBubbleMode] = useState<"" | "cap" | "tilt" | null>(null);
  const [raceSeen, setRaceSeen] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const mid = window.innerHeight / 2;
        let best = 0,
          bestD = Infinity;
        stepRefs.current.forEach((s, i) => {
          if (!s) return;
          const r = s.getBoundingClientRect();
          const c = r.top + r.height / 2;
          const d = Math.abs(c - mid);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const s = STEPS[active];
    if (s.scene === "bubbles") setBubbleMode(s.mode);
    if (s.scene === "race") setRaceSeen(true);
  }, [active]);

  const activeScene = STEPS[active].scene;

  return (
    <section className="scrolly">
      <div className="scrolly-graphic">
        <div className="why-stage">
          <div className={`scene${activeScene === "shelf" ? " on" : ""}`} data-scene="shelf">
            <div className="shelf" style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
              <div className="shelf-row">
                <div className="etf-card">
                  <div className="tk">VEQT</div>
                  <div className="nm">Vanguard All-Equity ETF Portfolio</div>
                  <div className="specs">
                    {[["Holdings", "~13,500"], ["Tickers to buy", "1"], ["Equity", "100%"], ["Weighting", "By size"], ["MER", "0.24%"]].map(([k, v]) => (
                      <div className="sp" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="etf-card cage">
                  <span className="badge">The contrarian</span>
                  <div className="tk">CAGE</div>
                  <div className="nm">Avantis CIBC All-Equity ETF</div>
                  <div className="specs">
                    <div className="sp"><span className="k">Holdings</span><span className="v">~9,000</span></div>
                    <div className="sp"><span className="k">Tickers to buy</span><span className="v">1</span></div>
                    <div className="sp"><span className="k">Equity</span><span className="v">100%</span></div>
                    <div className="sp"><span className="k">Weighting</span><span className="v" style={{ color: "var(--hot)" }}>By evidence</span></div>
                    <div className="sp"><span className="k">MER</span><span className="v">0.28%</span></div>
                  </div>
                </div>
              </div>
              <div className="shelf-q">On the shelf, nearly <em>identical.</em> Underneath, not even close.</div>
            </div>
            <div className="scene-tag">On the shelf</div>
          </div>

          <div className={`scene${activeScene === "bubbles" ? " on" : ""}`} data-scene="bubbles">
            <div className="scene-tag">{bubbleMode === "tilt" ? "Weighted by value × profitability" : "Weighted by market cap"}</div>
            <div className="bub-legend">
              <div className="li"><span className="sw" style={{ background: "#e8281f" }} />US</div>
              <div className="li"><span className="sw" style={{ background: "#f0c12a" }} />Canada</div>
              <div className="li"><span className="sw" style={{ background: "#e8e3d3" }} />Intl / EM</div>
            </div>
            <Bubbles mode={bubbleMode} />
            <div className="scene-cap">
              {bubbleMode === "tilt" ? (
                <><b>Red-ringed</b> bubbles grew under CAGE — cheaper, more profitable. The faded mega-caps shrank.</>
              ) : (
                <>Each circle is a company. Size = how much of the fund it is. The crowd piles into the biggest.</>
              )}
            </div>
          </div>

          <div className={`scene${activeScene === "race" ? " on" : ""}`} data-scene="race">
            <Race active={raceSeen} />
            <div className="scene-cap">Long-short academic factor indices. Live funds capture a fraction — but the direction has held for decades.</div>
          </div>
        </div>
      </div>

      <div className="scrolly-steps">
        <div className="step" ref={(el) => { stepRefs.current[0] = el; }}>
          <div className="step-n">01</div>
          <h2>Same <em>shelf.</em></h2>
          <p className="lead">Put CAGE and VEQT side by side and they look like twins.</p>
          <p>Both are <strong>one-ticker, all-equity, globally diversified</strong> ETFs. Buy either and you own thousands of companies across every continent, auto-rebalanced, for a fraction of a percent a year.</p>
          <p>So if they&apos;re so alike — <strong>why does CAGE exist?</strong> The answer is in one word on the spec sheet: <strong>weighting.</strong></p>
        </div>
        <div className="step" ref={(el) => { stepRefs.current[1] = el; }}>
          <div className="step-n">02</div>
          <h2>Cap-weighting trusts <em>the crowd.</em></h2>
          <p>VEQT and XEQT weight every company by its <strong>market capitalization</strong> — its price times its shares. The more the market already loves a stock, the bigger your slice.</p>
          <div className="pullnum">~25%<span className="u"> in 10 names</span></div>
          <p>A handful of US mega-caps — Apple, Microsoft, Nvidia — dominate the whole portfolio. You&apos;re not betting on the world. You&apos;re <strong>betting on whatever&apos;s already expensive.</strong></p>
        </div>
        <div className="step" ref={(el) => { stepRefs.current[2] = el; }}>
          <div className="step-n">03</div>
          <h2>CAGE tilts <em>on purpose.</em></h2>
          <p>Watch the same companies re-weight. CAGE systematically trims the priciest mega-caps and leans into stocks that are <strong>cheaper relative to their fundamentals</strong> and <strong>more profitable.</strong></p>
          <p>Nvidia shrinks. A profitable, unglamorous bank or energy name grows. Nothing is excluded — it&apos;s a <strong>tilt</strong>, not a bet on ten stocks.</p>
          <div className="ministat">
            <div className="ms"><div className="l">Top-10 weight</div><div className="v" style={{ color: "var(--gain)" }}>~11%</div></div>
            <div className="ms"><div className="l">vs VEQT</div><div className="v">~25%</div></div>
            <div className="ms"><div className="l">Names held</div><div className="v">~9,000</div></div>
          </div>
        </div>
        <div className="step" ref={(el) => { stepRefs.current[3] = el; }}>
          <div className="step-n">04</div>
          <h2>Why <em>those</em> tilts?</h2>
          <p className="lead">Because the data behind them is about as close to a law as finance gets.</p>
          <p>Nobel laureates Eugene Fama and Kenneth French spent decades showing that, over the long run, <strong>cheaper</strong> companies (value), <strong>more profitable</strong> companies, and <strong>smaller</strong> companies have earned higher returns than the market — repeated across 90+ years and dozens of countries.</p>
          <p>A dollar riding those tilts didn&apos;t just beat the market. It <strong>lapped it</strong> — though never in a straight line, and never without stretches of pain.</p>
        </div>
      </div>
    </section>
  );
}

// ─── Dials ────────────────────────────────────────────────────────────────────
function Dials() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="sec-block" id="dials-sec">
      <div className="sec-head">
        <div className="num">05</div>
        <h2>CAGE&apos;s <em>four dials.</em></h2>
        <div className="right">Loadings vs<br />ACWI IMI = 0</div>
      </div>
      <p className="sec-sub">CAGE doesn&apos;t guess. It turns four evidence-based dials, each measured against a plain market-cap index (where every dial sits at zero). Positive = CAGE leans <strong>into</strong> that style. Click a dial for the why.</p>
      <div className="dials" ref={ref}>
        {FACTOR_DIALS.map((d, i) => {
          const pct = Math.min(50, (Math.abs(d.load) / 0.7) * 50);
          const neg = d.load < 0;
          return (
            <div className={`dial${open === i ? " open" : ""}`} key={d.nm} onClick={() => setOpen(open === i ? null : i)}>
              <div className="top">
                <div className="nm">{d.nm} <em>{d.em}</em></div>
                <div className={`load${neg ? " neg" : ""}`}>{d.load >= 0 ? "+" : ""}{d.load.toFixed(2)}</div>
              </div>
              <div className="sub">{d.sub}</div>
              <div className="bar"><div className="mid" /><div className={`fill ${neg ? "neg" : "pos"}`} style={{ width: inView ? `${pct.toFixed(1)}%` : 0 }} /></div>
              <div className="ticks"><span>−0.7 underweight</span><span>ACWI = 0</span><span>+0.7 overweight</span></div>
              <div className="desc" dangerouslySetInnerHTML={{ __html: d.desc }} />
              <div className="more">Click for the evidence →</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Generic scroll-reveal wrapper ───────────────────────────────────────────
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLElement>(0.08);
  return (
    <section ref={ref} className={`${className ?? ""} reveal${inView ? " in" : ""}`}>
      {children}
    </section>
  );
}

export default function Why() {
  return (
    <>
      <SiteHeader active="why" right={<span className="wordmark"><span className="c" style={{ margin: 0 }}>12 min read</span></span>} />
      <ReadProgress />
      <main className="tp-why">
        <section className="why-hero intro">
          <div className="why-eyebrow"><span className="tag">The case</span> Why this, not VEQT?</div>
          <h1 className="why-h1">TRUST THE <em>math.</em><br />Not the crowd.</h1>
          <p className="why-dek">VEQT and XEQT hold the whole world by <strong>size</strong> — the bigger a company already is, the more you own. CAGE holds the whole world by <strong>evidence</strong> — tilting toward companies that are cheaper and more profitable. Same plumbing. Opposite philosophy.</p>
          <div className="why-byline">
            <span>By <b>The BuyCage Desk</b></span>
            <span>·</span>
            <span><b>Independent</b> · not advice</span>
          </div>
          <div className="scroll-hint"><span className="arr">↓</span> Scroll — the chart follows along</div>
        </section>

        <Scrolly />

        <Dials />

        <Reveal className="sec-block tight">
          <div className="sec-head">
            <div className="num">06</div>
            <h2>Head to <em>head.</em></h2>
            <div className="right">CAGE vs<br />VEQT · XEQT</div>
          </div>
          <p className="sec-sub">Where they&apos;re identical, where they diverge. CAGE costs <strong>4 basis points more</strong> than VEQT — about <strong>$4 a year on $10,000</strong> — and in exchange you get an active factor tilt instead of pure market-cap.</p>
          <div className="h2h">
            <div className="h2h-row head">
              <div className="c" />
              {H2H_COLS.map((c) => (
                <div className={`c fund ${c === "CAGE" ? "cage" : ""}`} key={c}><span className="tkr">{c}</span><span className="nm">{H2H_NAMES[c]}</span></div>
              ))}
            </div>
            {H2H_ROWS.map((r) => (
              <div className="h2h-row" key={r.k}>
                <div className="c k">{r.k}</div>
                <div className="c v cage-col"><span><b>{r.cage[0]}</b>{r.cage[1] && <span className="win">edge</span>}</span></div>
                <div className="c v"><span>{r.veqt[1] ? <b>{r.veqt[0]}</b> : r.veqt[0]}{r.veqt[1] && <span className="win">edge</span>}</span></div>
                <div className="c v"><span>{r.xeqt[1] ? <b>{r.xeqt[0]}</b> : r.xeqt[0]}{r.xeqt[1] && <span className="win">edge</span>}</span></div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="sec-block tight">
          <div className="sec-head">
            <div className="num">07</div>
            <h2>The <em>catch.</em></h2>
            <div className="right">Read this<br />part twice</div>
          </div>
          <p className="sec-sub">We&apos;re not here to sell you. A tilt is a decision to <strong>look different from the market</strong> — and looking different is the whole reason it can pay, and the whole reason it can hurt.</p>
          <div className="catch">
            <div className="ct"><div className="ic">01</div><h4>It can lag for years</h4><p>Value underperformed growth for most of <strong>2010–2020</strong>. A factor tilt can trail a plain index for a <strong>decade</strong> before the premium shows up. If you&apos;ll panic-sell after three bad years, the tilt will hurt you, not help you.</p></div>
            <div className="ct"><div className="ic">02</div><h4>You pay a little more</h4><p>0.28% vs VEQT&apos;s 0.24%. Small, but real. You&apos;re paying for <strong>active implementation</strong> — daily screening on price and profitability — not just index replication.</p></div>
            <div className="ct"><div className="ic">03</div><h4>Tracking error is the price</h4><p>CAGE will sometimes <strong>visibly trail</strong> the index your friends own. That difference — tracking error — is not a bug. It&apos;s the cost of admission to a premium that only exists because most people won&apos;t tolerate it.</p></div>
          </div>
        </Reveal>

        <Reveal className="sec-block tight">
          <div className="sec-head">
            <div className="num">08</div>
            <h2>So, <em>is it for you?</em></h2>
            <div className="right">The honest<br />answer</div>
          </div>
          <div className="verdict">
            <div className="col yes">
              <div className="h"><span className="dot" />CAGE makes sense if you…</div>
              <ul>
                <li>Can answer <strong>&ldquo;why this, not VEQT?&rdquo;</strong> in one sentence — and now you can.</li>
                <li>Have a <strong>10-year-plus</strong> horizon and won&apos;t flinch when the tilt lags.</li>
                <li>Believe decades of evidence beat the crowd&apos;s latest favourite.</li>
                <li>Want a tilt <strong>built in</strong>, not a five-fund spreadsheet.</li>
              </ul>
            </div>
            <div className="col no">
              <div className="h"><span className="dot" />Stick with VEQT/XEQT if you…</div>
              <ul>
                <li>Will compare your return to a friend&apos;s index fund <strong>every quarter.</strong></li>
                <li>Want the <strong>cheapest possible</strong> all-in-one and nothing more.</li>
                <li>Don&apos;t have conviction in factor premia — <strong>and that&apos;s fine.</strong></li>
                <li>Would sell the moment CAGE trails for a couple of years.</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="why-cta">
          <div className="band">
            <h3>Market-cap says <strong>&ldquo;trust the crowd.&rdquo;</strong><br />CAGE says <strong>&ldquo;trust the math.&rdquo;</strong></h3>
            <div className="actions">
              <Link href="/inside" className="btn solid">See inside CAGE →</Link>
              <Link href="/" className="btn ghost">Back to today</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter left="© 2026 BuyCage · Not investment advice · Independent" right={<>Factor data: Fama–French / Avantis</>} />
    </>
  );
}
