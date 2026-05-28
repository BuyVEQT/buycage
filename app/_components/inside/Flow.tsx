"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDataset } from "../overview/dataset";
import { SIB_PALETTE } from "../overview/data";
import { SLEEVE_SHORT, SANKEY_REGIONS, SANKEY_FLOWS } from "./inside.data";

const W = 1280,
  H = 520,
  P = 24;
const colSourceX = 60,
  colSleeveX = 460,
  colRegionX = 920,
  nodeW = 22;

type Hover = { kind: "node"; id: string } | { kind: "flow"; from: string; to: string } | null;

function bez(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function Flow() {
  const { SIBLINGS } = useDataset();
  const svgRef = useRef<SVGSVGElement>(null);
  const particleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [hover, setHover] = useState<Hover>(null);

  const sleeves = useMemo(
    () => SIBLINGS.map((s) => ({ t: s.ticker, w: s.weight, color: SIB_PALETTE[s.color], name: SLEEVE_SHORT[s.ticker]?.name ?? s.ticker })),
    [SIBLINGS]
  );

  const geom = useMemo(() => {
    const sourceY0 = P + 20;
    const sourceH = H - 2 * P - 40;
    const sourceY1 = sourceY0 + sourceH;

    const sleeveGap = 12;
    const sleeveTotalH = sourceH - sleeveGap * (sleeves.length - 1);
    let cur = sourceY0;
    const sleevePos: Record<string, { y0: number; y1: number; h: number; color: string; name: string }> = {};
    sleeves.forEach((s) => {
      const h = sleeveTotalH * s.w;
      sleevePos[s.t] = { y0: cur, y1: cur + h, h, color: s.color, name: s.name };
      cur += h + sleeveGap;
    });

    const regionGap = 10;
    const regionTotalH = sourceH - regionGap * (SANKEY_REGIONS.length - 1);
    cur = sourceY0;
    const regionPos: Record<string, { y0: number; y1: number; h: number; name: string; pct: number }> = {};
    SANKEY_REGIONS.forEach((r) => {
      const h = regionTotalH * (r.pct / 100);
      regionPos[r.id] = { y0: cur, y1: cur + h, h, name: r.name, pct: r.pct };
      cur += h + regionGap;
    });

    const cumulativeBefore = (t: string) => {
      let c = 0;
      for (const s of sleeves) {
        if (s.t === t) break;
        c += s.w;
      }
      return c;
    };

    // source → sleeve flow paths
    const srcFlows = sleeves.map((s) => {
      const sp = sleevePos[s.t];
      const x0 = colSourceX + nodeW,
        x1 = colSleeveX,
        xmid = (x0 + x1) / 2;
      const srcY0 = sourceY0 + cumulativeBefore(s.t) * sourceH;
      const srcY1 = srcY0 + s.w * sourceH;
      const d = `M ${x0} ${srcY0} C ${xmid} ${srcY0}, ${xmid} ${sp.y0}, ${x1} ${sp.y0} L ${x1} ${sp.y1} C ${xmid} ${sp.y1}, ${xmid} ${srcY1}, ${x0} ${srcY1} Z`;
      return { d, color: s.color, from: "src", to: s.t };
    });

    // sleeve → region flow paths (ordered by sleeve then region)
    const ordered = [...SANKEY_FLOWS].sort((a, b) => {
      const sa = sleeves.findIndex((s) => s.t === a.from),
        sb = sleeves.findIndex((s) => s.t === b.from);
      if (sa !== sb) return sa - sb;
      return SANKEY_REGIONS.findIndex((r) => r.id === a.to) - SANKEY_REGIONS.findIndex((r) => r.id === b.to);
    });
    const outOff: Record<string, number> = {};
    sleeves.forEach((s) => (outOff[s.t] = 0));
    const inOff: Record<string, number> = {};
    SANKEY_REGIONS.forEach((r) => (inOff[r.id] = 0));
    const srFlows = ordered.map((fl) => {
      const sp = sleevePos[fl.from],
        rp = regionPos[fl.to];
      const sw = sleeves.find((x) => x.t === fl.from)!.w;
      const x0 = colSleeveX + nodeW,
        x1 = colRegionX,
        xmid = (x0 + x1) / 2;
      const sBandH = (fl.v / (sw * 100)) * sp.h;
      const sy0 = sp.y0 + outOff[fl.from];
      const sy1 = sy0 + sBandH;
      outOff[fl.from] += sBandH;
      const rBandH = (fl.v / rp.pct) * rp.h;
      const ry0 = rp.y0 + inOff[fl.to];
      const ry1 = ry0 + rBandH;
      inOff[fl.to] += rBandH;
      const d = `M ${x0} ${sy0} C ${xmid} ${sy0}, ${xmid} ${ry0}, ${x1} ${ry0} L ${x1} ${ry1} C ${xmid} ${ry1}, ${xmid} ${sy1}, ${x0} ${sy1} Z`;
      return { d, color: sp.color, from: fl.from, to: fl.to };
    });

    // rails for particles
    const rails: { pts: [number, number][]; color: string; from: string; to: string; w: number }[] = [];
    sleeves.forEach((s) => {
      const sp = sleevePos[s.t];
      const x0 = colSourceX + nodeW,
        x1 = colSleeveX,
        xmid = (x0 + x1) / 2;
      const srcY0 = sourceY0 + cumulativeBefore(s.t) * sourceH;
      const yA = srcY0 + (s.w * sourceH) / 2,
        yB = (sp.y0 + sp.y1) / 2;
      rails.push({ pts: [], color: s.color, from: "src", to: s.t, w: s.w });
      const rail = rails[rails.length - 1];
      for (let i = 0; i <= 48; i++) {
        const t = i / 48;
        rail.pts.push([bez(x0, xmid, xmid, x1, t), bez(yA, yA, yB, yB, t)]);
      }
    });
    const outO: Record<string, number> = {};
    sleeves.forEach((s) => (outO[s.t] = 0));
    const inO: Record<string, number> = {};
    SANKEY_REGIONS.forEach((r) => (inO[r.id] = 0));
    ordered.forEach((fl) => {
      const sp = sleevePos[fl.from],
        rp = regionPos[fl.to];
      const sw = sleeves.find((x) => x.t === fl.from)!.w;
      const x0 = colSleeveX + nodeW,
        x1 = colRegionX,
        xmid = (x0 + x1) / 2;
      const sBandH = (fl.v / (sw * 100)) * sp.h;
      const yA = sp.y0 + outO[fl.from] + sBandH / 2;
      outO[fl.from] += sBandH;
      const rBandH = (fl.v / rp.pct) * rp.h;
      const yB = rp.y0 + inO[fl.to] + rBandH / 2;
      inO[fl.to] += rBandH;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 48; i++) {
        const t = i / 48;
        pts.push([bez(x0, xmid, xmid, x1, t), bez(yA, yA, yB, yB, t)]);
      }
      rails.push({ pts, color: sp.color, from: fl.from, to: fl.to, w: fl.v / 100 });
    });

    const particles: { rail: number; off: number; spd: number; r: number; color: string; from: string; to: string }[] = [];
    rails.forEach((rail, ri) => {
      const count = Math.max(2, Math.round(rail.w * 26));
      for (let i = 0; i < count; i++) {
        particles.push({ rail: ri, off: Math.random(), spd: 0.1 + Math.random() * 0.1, r: 1.4 + Math.random() * 1.2, color: rail.color, from: rail.from, to: rail.to });
      }
    });

    return { sourceY0, sourceH, sourceY1, sleevePos, regionPos, srcFlows, srFlows, rails, particles };
  }, [sleeves]);

  // particle animation
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let running = true;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      geom.particles.forEach((p, i) => {
        p.off += p.spd * dt;
        if (p.off > 1) p.off -= 1;
        const rail = geom.rails[p.rail];
        const idx = p.off * 48;
        const i0 = Math.floor(idx),
          f = idx - i0;
        const a = rail.pts[i0],
          b = rail.pts[Math.min(48, i0 + 1)];
        const el = particleRefs.current[i];
        if (el && a && b) {
          el.setAttribute("cx", (a[0] + (b[0] - a[0]) * f).toFixed(1));
          el.setAttribute("cy", (a[1] + (b[1] - a[1]) * f).toFixed(1));
          const edge = Math.min(p.off, 1 - p.off);
          el.setAttribute("opacity", Math.min(0.95, edge * 8).toFixed(2));
        }
      });
      if (running) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => {
        if (e.isIntersecting && !running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(loop);
        } else if (!e.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      }),
      { threshold: 0 }
    );
    if (svgRef.current) io.observe(svgRef.current);
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [geom]);

  // hover-derived highlight sets
  const isConnected = (a: string, b: string) => SANKEY_FLOWS.some((f) => (f.from === a && f.to === b) || (f.from === b && f.to === a));
  const flowOn = (from: string, to: string) => {
    if (!hover) return false;
    if (hover.kind === "node") return from === hover.id || to === hover.id;
    return from === hover.from && to === hover.to;
  };
  const nodeOn = (id: string) => {
    if (!hover) return false;
    if (hover.kind === "node") return id === hover.id || isConnected(id, hover.id);
    return id === hover.from || id === hover.to;
  };

  const readout = (() => {
    if (!hover) return <>Showing <b>all 5 sleeves</b> · 6 regions · hover any node or stream</>;
    if (hover.kind === "flow") {
      const v = SANKEY_FLOWS.find((f) => f.from === hover.from && f.to === hover.to)?.v;
      return <><b>{hover.from} → {hover.to}</b> · {v?.toFixed(1)}% of CAGE</>;
    }
    const s = sleeves.find((x) => x.t === hover.id);
    if (s) {
      const regions = SANKEY_FLOWS.filter((f) => f.from === hover.id).map((f) => `${f.to} ${f.v.toFixed(1)}%`).join(" · ");
      return <><span style={{ color: s.color }}>{s.t}</span> {s.name} · {(s.w * 100).toFixed(1)}% of fund · routes to <b>{regions}</b></>;
    }
    const r = SANKEY_REGIONS.find((x) => x.id === hover.id);
    if (r) {
      const sl = SANKEY_FLOWS.filter((f) => f.to === hover.id).map((f) => `${f.from} ${f.v.toFixed(1)}%`).join(" · ");
      return <><span style={{ color: "var(--hot)" }}>{r.name}</span> · {r.pct.toFixed(1)}% of CAGE · fed by <b>{sl}</b></>;
    }
    return <>Your <b>$100</b> · routed to <b>5 sleeves</b> across <b>6 regions</b></>;
  })();

  return (
    <section id="flow" className="sec-block">
      <div className="sec-head">
        <div className="num">03</div>
        <h2>The <em>flow.</em></h2>
        <div className="right">$100 → sleeves<br />→ regions</div>
      </div>
      <p className="sec-sub">If you buy <strong>$100</strong> of CAGE, here&apos;s where it actually goes — split across the five Avantis sleeves, then routed by geography. Hover any node or stream to highlight the path.</p>

      <div className={`flow-frame${hover ? " dim" : ""}`}>
        <div className="flow-stage-labels">
          <span>Your dollar</span>
          <span>Avantis sleeve</span>
          <span>Region</span>
        </div>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {/* source → sleeve flows */}
          {geom.srcFlows.map((f) => (
            <path key={`s-${f.to}`} className={`sk-flow${flowOn(f.from, f.to) ? " on" : ""}`} d={f.d} fill={f.color} fillOpacity={0.32} data-from={f.from} data-to={f.to}
              onMouseEnter={() => setHover({ kind: "flow", from: f.from, to: f.to })} onMouseLeave={() => setHover(null)} />
          ))}
          {/* sleeve → region flows */}
          {geom.srFlows.map((f) => (
            <path key={`r-${f.from}-${f.to}`} className={`sk-flow${flowOn(f.from, f.to) ? " on" : ""}`} d={f.d} fill={f.color} fillOpacity={0.42} data-from={f.from} data-to={f.to}
              onMouseEnter={() => setHover({ kind: "flow", from: f.from, to: f.to })} onMouseLeave={() => setHover(null)} />
          ))}

          {/* source node */}
          <g className="sk-node" onMouseEnter={() => setHover({ kind: "node", id: "src" })} onMouseLeave={() => setHover(null)}>
            <rect className={nodeOn("src") ? "on" : undefined} x={colSourceX} y={geom.sourceY0} width={nodeW} height={geom.sourceH} fill="var(--ink)" />
            <text className="sk-label b" x={colSourceX + nodeW + 10} y={(geom.sourceY0 + geom.sourceY1) / 2 - 8}>$100</text>
            <text className="sk-label" x={colSourceX + nodeW + 10} y={(geom.sourceY0 + geom.sourceY1) / 2 + 12}>YOUR PURCHASE</text>
          </g>

          {/* sleeve nodes */}
          {sleeves.map((s) => {
            const sp = geom.sleevePos[s.t];
            return (
              <g key={s.t} className="sk-node" onMouseEnter={() => setHover({ kind: "node", id: s.t })} onMouseLeave={() => setHover(null)}>
                <rect className={nodeOn(s.t) ? "on" : undefined} x={colSleeveX} y={sp.y0} width={nodeW} height={sp.h} fill={s.color} />
                <text className="sk-label b" x={colSleeveX + nodeW + 10} y={sp.y0 + 14}>{s.t}</text>
                <text className="sk-label" x={colSleeveX + nodeW + 10} y={sp.y0 + 30}>{s.name.toUpperCase()}</text>
                <text className="sk-label pct" x={colSleeveX + nodeW + 10} y={sp.y0 + 44}>{(s.w * 100).toFixed(1)}%</text>
              </g>
            );
          })}

          {/* region nodes */}
          {SANKEY_REGIONS.map((r) => {
            const rp = geom.regionPos[r.id];
            const tight = rp.h < 24;
            return (
              <g key={r.id} className="sk-node" onMouseEnter={() => setHover({ kind: "node", id: r.id })} onMouseLeave={() => setHover(null)}>
                <rect className={nodeOn(r.id) ? "on" : undefined} x={colRegionX} y={rp.y0} width={nodeW} height={rp.h} fill="var(--ink-2)" />
                <text className="sk-label b" x={colRegionX + nodeW + 10} y={rp.y0 + (tight ? rp.h / 2 + 4 : 14)}>{r.name}{tight ? ` · ${r.pct.toFixed(1)}%` : ""}</text>
                {!tight && <text className="sk-label pct" x={colRegionX + nodeW + 10} y={rp.y0 + 28}>{r.pct.toFixed(1)}% · ${r.pct.toFixed(2)}</text>}
              </g>
            );
          })}

          {/* particles */}
          <g>
            {geom.particles.map((p, i) => (
              <circle key={i} ref={(el) => { particleRefs.current[i] = el; }} className={`sk-particle${flowOn(p.from, p.to) ? " on" : ""}`} r={p.r.toFixed(1)} fill={p.color} cx={-10} cy={-10} />
            ))}
          </g>
        </svg>
        <div className="flow-foot">
          <span><strong>Hover</strong> any node or stream to highlight the path</span>
          <span className="ro">{readout}</span>
        </div>
      </div>
    </section>
  );
}
