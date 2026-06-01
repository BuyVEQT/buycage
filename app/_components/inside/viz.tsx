import { useEffect, useRef, useState } from "react";

export const TAU = Math.PI * 2;

// Annular arc path (sunburst wedge) from angle a0→a1, radius r0→r1.
export function arc(a0: number, a1: number, r0: number, r1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  // Round to 2 decimals. Math.sin/cos can differ in the last ULP between the
  // SSR (Node) and client (browser) JS engines, which otherwise trips React
  // hydration on the full-precision path string. Sub-pixel in these viewBoxes.
  const f = (n: number) => n.toFixed(2);
  const x0 = Math.sin(a0) * r1,
    y0 = -Math.cos(a0) * r1;
  const x1 = Math.sin(a1) * r1,
    y1 = -Math.cos(a1) * r1;
  const x2 = Math.sin(a1) * r0,
    y2 = -Math.cos(a1) * r0;
  const x3 = Math.sin(a0) * r0,
    y3 = -Math.cos(a0) * r0;
  return `M ${f(x0)} ${f(y0)} A ${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)} A ${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)} Z`;
}

// Deterministic sparkline path over a 52×18 box (holdings rows).
export function sparkPath(seed: number, dir: number): string {
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

// Fire once when the element scrolls into view (with already-in-view fallback).
export function useInView<T extends Element>(threshold = 0.2) {
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
    const raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) && r.bottom > 0) {
        setInView(true);
        io.disconnect();
      }
    });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return { ref, inView };
}

// Ease-out count-up to `target`, restarting when `enabled` flips true.
export function useCountUp(target: number, dur = 1200, enabled = true): number {
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
