"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { CAGE_BARS, PRICE, type Bar } from "./data";

// ─── helpers ─────────────────────────────────────────────────────────────────
function dailyReturnsFrom(bars: Bar[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    out.push((bars[i].close - bars[i - 1].close) / bars[i - 1].close);
  }
  return out;
}
function meanStd(arr: number[]): { mean: number; std: number } {
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return { mean, std: Math.sqrt(variance) };
}
function erf(x: number): number {
  const sign = Math.sign(x);
  x = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741;
  const a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
function normCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

type SeverityKey = "snoozer" | "mild" | "notable" | "spicy" | "wild";
type Severity = {
  key: SeverityKey;
  label: string;
  copy: string;
  hint: string;
};

function severityFor(absZ: number): Severity {
  if (absZ < 0.4)
    return {
      key: "snoozer",
      label: "Quiet day",
      copy: "Barely a ripple.",
      hint: "Nothing to look at — come back tomorrow.",
    };
  if (absZ < 0.9)
    return {
      key: "mild",
      label: "Mild move",
      copy: "A normal trading day.",
      hint: "Typical magnitude. Nothing unusual.",
    };
  if (absZ < 1.5)
    return {
      key: "notable",
      label: "Notable move",
      copy: "A bit more than usual.",
      hint: "Worth a glance at the leaderboard.",
    };
  if (absZ < 2.2)
    return {
      key: "spicy",
      label: "Spicy session",
      copy: "One of the bigger days this quarter.",
      hint: "Bigger than typical. Sit on your hands.",
    };
  return {
    key: "wild",
    label: "Wild day",
    copy: "Unusual magnitude — pay attention.",
    hint: "Outsized move. Don't react impulsively.",
  };
}
function intensityFor(absZ: number): number {
  return Math.min(1, Math.max(0.08, absZ / 2.4));
}

function streakFromBars(bars: Bar[]): { count: number; dir: number } {
  if (bars.length < 2) return { count: 0, dir: 0 };
  const closes = bars.map((b) => b.close);
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const dir = Math.sign(last - prev);
  if (dir === 0) return { count: 0, dir: 0 };
  let count = 1;
  for (let i = closes.length - 2; i > 0; i--) {
    if (Math.sign(closes[i] - closes[i - 1]) === dir) count++;
    else break;
  }
  return { count, dir };
}

// ─── CageGlyph ───────────────────────────────────────────────────────────────
type Particle =
  | { type: "Z"; x: number; y: number; op: number; scale: number }
  | { type: "dot"; x: number; y: number; op: number }
  | { type: "spark"; x: number; y: number; op: number }
  | { type: "bolt"; x: number; y: number; op: number; angle: number };

function CageGlyph({
  intensity,
  direction,
  severity,
  sizeStyle,
}: {
  intensity: number;
  direction: number;
  severity: SeverityKey;
  sizeStyle: CSSProperties;
}) {
  const w = 192,
    h = 192;
  const cx = w / 2;
  const barCount = 9;
  const cageTop = 42;
  const cageBottom = 144;
  const cageLeft = 32;
  const cageRight = w - 32;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const loop = (now: number) => {
      setTick((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const orbBaseY = (cageTop + cageBottom) / 2;
  const dirBias = -direction * (18 + intensity * 10);
  const orbY = orbBaseY + dirBias;
  const orbColor = direction >= 0 ? "var(--gain)" : "var(--loss)";

  const sevAmp =
    ({ snoozer: 0.4, mild: 1.5, notable: 3.0, spicy: 5.5, wild: 9 }[
      severity
    ]) ?? 2;
  const sevSpeed =
    ({ snoozer: 0.6, mild: 1.0, notable: 1.6, spicy: 2.3, wild: 3.4 }[
      severity
    ]) ?? 1;
  const swayAmp = sevAmp;
  const swaySpeed = sevSpeed;

  const shake = severity === "wild" ? Math.sin(tick * 28) * 1.6 : 0;

  const orbBob =
    severity === "snoozer"
      ? Math.sin(tick * 1.2) * 1.4
      : severity === "wild"
      ? Math.sin(tick * 5.5) * 6 + Math.cos(tick * 7.1) * 3
      : (intensity * 6 + 2) * Math.sin(tick * (1.6 + intensity * 1.5));
  const orbSwing =
    severity === "spicy" || severity === "wild"
      ? Math.sin(tick * (severity === "wild" ? 4.2 : 2.4)) *
        (severity === "wild" ? 8 : 5)
      : 0;
  const orbPulse =
    1 + (severity === "wild" ? 0.08 : 0.04) * Math.sin(tick * (severity === "wild" ? 5 : 3.4));
  const auraOpacity =
    severity === "snoozer"
      ? 0.1 + 0.04 * Math.sin(tick * 1.0)
      : 0.2 + intensity * 0.35 + 0.07 * Math.sin(tick * 4.6);

  const particles = useMemo<Particle[]>(() => {
    if (severity === "snoozer") {
      return Array.from({ length: 3 }).map((_, i) => {
        const phase = (tick * 0.6 + i * 0.6) % 1;
        const x = cx + 22 + Math.sin(phase * Math.PI * 2 + i) * 4;
        const y = orbY - 8 - phase * 28;
        const op = (1 - phase) * 0.65;
        const scale = 0.8 + phase * 0.4;
        return { type: "Z", x, y, op, scale } as Particle;
      });
    }
    if (severity === "mild") return [];
    if (severity === "notable") {
      const count = 4;
      return Array.from({ length: count }).map((_, i) => {
        const phase = i * 1.5 + tick * 0.6;
        const angle = phase * 0.7;
        const r = 36 + 4 * Math.sin(phase);
        return {
          type: "dot",
          x: cx + r * Math.cos(angle),
          y: orbY + r * Math.sin(angle) * 0.7,
          op: 0.5,
        } as Particle;
      });
    }
    if (severity === "spicy") {
      const count = 7;
      return Array.from({ length: count }).map((_, i) => {
        const phase = i * 1.2 + tick * 1.4;
        const angle = phase * 0.8;
        const r = 30 + 24 * Math.sin(phase * 0.7);
        const op = 0.4 + 0.35 * Math.sin(phase * 1.3);
        return {
          type: "spark",
          x: cx + r * Math.cos(angle),
          y: orbY + r * Math.sin(angle) * 0.7,
          op,
        } as Particle;
      });
    }
    const count = 14;
    const arr: Particle[] = Array.from({ length: count }).map((_, i) => {
      const phase = i * 0.9 + tick * 2.2;
      const angle = phase;
      const r = 26 + 32 * Math.abs(Math.sin(phase * 0.6));
      const op = 0.4 + 0.4 * Math.sin(phase * 1.7);
      return {
        type: "spark",
        x: cx + r * Math.cos(angle),
        y: orbY + r * Math.sin(angle),
        op,
      };
    });
    const flash = (Math.sin(tick * 3.8) + 1) / 2;
    if (flash > 0.85) {
      const angle = (tick * 1.7) % (Math.PI * 2);
      arr.push({
        type: "bolt",
        x: cx + Math.cos(angle) * 70,
        y: orbY + Math.sin(angle) * 30,
        angle,
        op: (flash - 0.85) * 6,
      });
    }
    return arr;
  }, [severity, tick, orbY, cx]);

  const bars: number[] = [];
  const inset = 10;
  const innerW = cageRight - cageLeft - inset * 2;
  for (let i = 0; i < barCount; i++) {
    bars.push(cageLeft + inset + (innerW * i) / (barCount - 1));
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={sizeStyle}
      className="select-none"
      aria-hidden
    >
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={orbColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={orbColor} stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={orbColor} stopOpacity="0.7" />
          <stop offset="100%" stopColor={orbColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform={`translate(${shake}, ${shake * 0.5})`}>
        <circle
          cx={cx}
          cy={orbY + orbBob}
          r={severity === "wild" ? 42 : 22 + intensity * 18}
          fill="url(#auraGrad)"
          opacity={auraOpacity}
        />
        <path
          d={`M ${cageLeft} ${cageTop + 12} Q ${cx} ${cageTop - 14} ${cageRight} ${cageTop + 12}`}
          stroke="var(--fg-secondary)"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d={`M ${cx} ${cageTop - 6} L ${cx} ${cageTop - 18} Q ${cx} ${cageTop - 28} ${cx - 8} ${cageTop - 28}`}
          stroke="var(--fg-secondary)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />

        {bars.map((x, i) => {
          const phase = i * 0.6 + tick * swaySpeed;
          const offset = swayAmp * Math.sin(phase);
          const topX = x + offset * 0.35;
          const botX = x - offset * 0.65;
          if (severity === "wild") {
            const midX = (topX + botX) / 2 + Math.sin(phase * 1.2) * 3;
            const midY = (cageTop + 12 + cageBottom) / 2;
            return (
              <path
                key={i}
                d={`M ${topX} ${cageTop + 12} Q ${midX} ${midY} ${botX} ${cageBottom}`}
                stroke="var(--fg-tertiary)"
                strokeOpacity={0.75}
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            );
          }
          return (
            <line
              key={i}
              x1={topX}
              y1={cageTop + 12}
              x2={botX}
              y2={cageBottom}
              stroke="var(--fg-tertiary)"
              strokeOpacity={0.55 + intensity * 0.3}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          );
        })}

        <line
          x1={cageLeft}
          y1={cageBottom}
          x2={cageRight}
          y2={cageBottom}
          stroke="var(--fg-secondary)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <ellipse
          cx={cx}
          cy={cageBottom + 6}
          rx={36 + intensity * 6}
          ry={3.4}
          fill="var(--fg)"
          opacity="0.06"
        />

        <g
          style={{
            transform: `translate(${cx + orbSwing}px, ${orbY + orbBob}px) scale(${orbPulse})`,
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        >
          <circle r="14" fill="url(#orbGrad)" />
          <circle
            r="14"
            fill="none"
            stroke={orbColor}
            strokeOpacity="0.7"
            strokeWidth="1"
          />
          <circle cx="-4" cy="-5" r="3" fill="var(--bg)" opacity="0.55" />
          {severity === "snoozer" ? (
            <path
              d="M -5 -1 Q 0 3 5 -1"
              stroke="var(--bg)"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <path
              d={direction >= 0 ? "M -4 2 L 0 -3 L 4 2" : "M -4 -2 L 0 3 L 4 -2"}
              stroke="var(--bg)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        {particles.map((p, i) => {
          if (p.type === "Z") {
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                fontSize={11}
                fontFamily="var(--font-serif)"
                fontStyle="italic"
                fill="var(--fg-tertiary)"
                opacity={p.op}
                style={{
                  transform: `scale(${p.scale})`,
                  transformBox: "fill-box",
                  transformOrigin: `${p.x}px ${p.y}px`,
                }}
              >
                z
              </text>
            );
          }
          if (p.type === "dot") {
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="1.4"
                fill={orbColor}
                opacity={p.op}
              />
            );
          }
          if (p.type === "spark") {
            return (
              <g
                key={i}
                transform={`translate(${p.x}, ${p.y})`}
                opacity={p.op}
              >
                <circle r="1.2" fill={orbColor} />
                <line
                  x1="-3"
                  y1="0"
                  x2="3"
                  y2="0"
                  stroke={orbColor}
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              </g>
            );
          }
          return (
            <g
              key={i}
              transform={`translate(${p.x}, ${p.y}) rotate(${(p.angle * 180) / Math.PI})`}
              opacity={p.op}
            >
              <path
                d="M -3 -6 L 1 -2 L -1 -1 L 3 5"
                stroke={orbColor}
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── BellCurve ───────────────────────────────────────────────────────────────
function BellCurve({
  todayReturn,
  mean,
  std,
}: {
  todayReturn: number;
  mean: number;
  std: number;
}) {
  const w = 320,
    h = 96;
  const padX = 8,
    padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const z = (todayReturn - mean) / std;
  const zClamped = Math.max(-2.9, Math.min(2.9, z));
  const pct = normCdf(z);

  const samples = 121;
  const pts: { x: number; y: number }[] = [];
  let maxY = 0;
  for (let i = 0; i < samples; i++) {
    const x = -3 + (6 * i) / (samples - 1);
    const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    pts.push({ x, y });
    if (y > maxY) maxY = y;
  }
  const xToPx = (x: number) => padX + ((x + 3) / 6) * innerW;
  const yToPx = (y: number) =>
    padY + innerH - (y / maxY) * innerH * 0.94;

  const path = pts
    .map((p, i) => (i === 0 ? "M" : "L") + xToPx(p.x).toFixed(2) + "," + yToPx(p.y).toFixed(2))
    .join(" ");
  const areaPath =
    path + ` L ${xToPx(3)} ${padY + innerH} L ${xToPx(-3)} ${padY + innerH} Z`;

  const tailSamples = pts.filter((p) =>
    z >= 0 ? p.x >= zClamped : p.x <= zClamped
  );
  const tailPath =
    tailSamples.length > 1
      ? tailSamples
          .map(
            (p, i) =>
              (i === 0 ? "M" : "L") +
              xToPx(p.x).toFixed(2) +
              "," +
              yToPx(p.y).toFixed(2)
          )
          .join(" ") +
        ` L ${xToPx(tailSamples[tailSamples.length - 1].x)} ${padY + innerH}` +
        ` L ${xToPx(tailSamples[0].x)} ${padY + innerH} Z`
      : "";

  const pinX = xToPx(zClamped);
  const pinColor = todayReturn >= 0 ? "var(--gain)" : "var(--loss)";

  const [dropProgress, setDropProgress] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now() + 200;
    const dur = 700;
    const loop = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / dur));
      const eased = 1 - Math.pow(1 - t, 3);
      setDropProgress(eased);
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [todayReturn]);

  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const loop = (now: number) => {
      setPulse((now - start) / 1800);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pulsePhase = pulse % 1;
  const pulseR = 3.8 + pulsePhase * 5.2;
  const pulseOp = (1 - pulsePhase) * 0.35;

  const pinY = padY + 4;
  const pinBaseY = padY + innerH;
  const dropOffset = (1 - dropProgress) * -22;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-[96px] overflow-visible"
      >
        <defs>
          <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--fg-tertiary)"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="var(--fg-tertiary)"
              stopOpacity="0.02"
            />
          </linearGradient>
          <linearGradient id="tailFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pinColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={pinColor} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#bellFill)" />
        <path d={path} stroke="var(--fg-tertiary)" strokeWidth="1.2" fill="none" />
        {tailPath && <path d={tailPath} fill="url(#tailFill)" />}

        {[-2, -1, 0, 1, 2].map((s) => (
          <g key={s} opacity="0.55">
            <line
              x1={xToPx(s)}
              y1={padY + innerH - 4}
              x2={xToPx(s)}
              y2={padY + innerH}
              stroke="var(--fg-tertiary)"
              strokeWidth="1"
            />
            <text
              x={xToPx(s)}
              y={padY + innerH + 10}
              textAnchor="middle"
              fontSize="8"
              fill="var(--fg-tertiary)"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {s === 0 ? "0" : (s > 0 ? "+" : "") + s + "σ"}
            </text>
          </g>
        ))}

        <g
          style={{
            transform: `translate(${pinX}px, ${dropOffset}px)`,
            opacity: dropProgress,
          }}
        >
          <line
            x1="0"
            y1={pinY}
            x2="0"
            y2={pinBaseY}
            stroke={pinColor}
            strokeWidth="1.6"
          />
          <circle cx="0" cy={pinY} r="3.8" fill={pinColor} />
          <circle
            cx="0"
            cy={pinY}
            r={pulseR}
            fill="none"
            stroke={pinColor}
            strokeOpacity={pulseOp}
            strokeWidth="4"
          />
        </g>
      </svg>

      <div className="flex items-center justify-between text-[11px] text-[var(--fg-tertiary)] mt-1 num">
        <span>
          <span className="text-[var(--fg)] font-medium">
            {(pct * 100).toFixed(0)}th
          </span>{" "}
          percentile of recent moves.
        </span>
        <span>
          {z >= 0 ? "+" : ""}
          {z.toFixed(2)}σ
        </span>
      </div>
    </div>
  );
}

// ─── StreakBadge ─────────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: { count: number; dir: number } }) {
  if (!streak.count) {
    return (
      <span className="text-[11px] text-[var(--fg-tertiary)] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-tertiary)]" />
        Flat
      </span>
    );
  }
  const color = streak.dir > 0 ? "var(--gain)" : "var(--loss)";
  const label = streak.dir > 0 ? "up" : "down";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] num"
      style={{ color }}
    >
      <span className="font-medium">
        {streak.count} {label} {streak.count === 1 ? "day" : "days"}
      </span>
      <span className="flex items-end gap-[2px] h-3">
        {Array.from({ length: Math.min(streak.count, 5) }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{
              background: color,
              height:
                streak.dir > 0 ? `${4 + i * 2}px` : `${12 - i * 2}px`,
            }}
          />
        ))}
      </span>
    </span>
  );
}

// ─── DayVitals ───────────────────────────────────────────────────────────────
export function DayVitals() {
  const P = PRICE;
  const bars = CAGE_BARS;
  const last60Bars = bars.slice(-60);
  const todayReturn = P.dayChangePct / 100;

  const { mean, std, absZ, dir } = useMemo(() => {
    const rets = dailyReturnsFrom(last60Bars);
    const { mean, std } = meanStd(rets);
    const z = (todayReturn - mean) / std;
    return { mean, std, absZ: Math.abs(z), dir: Math.sign(todayReturn) || 1 };
  }, [todayReturn, last60Bars]);

  const severity = severityFor(absZ);
  const intensity = intensityFor(absZ);
  const streak = useMemo(() => streakFromBars(bars), [bars]);

  const [rattle, setRattle] = useState<number | null>(null);
  useEffect(() => {
    if (rattle == null) return;
    const id = setTimeout(() => setRattle(null), 1400);
    return () => clearTimeout(id);
  }, [rattle]);

  const liveIntensity = rattle != null ? Math.min(1, intensity + 0.7) : intensity;
  const liveSeverity =
    rattle != null
      ? severity.key === "snoozer"
        ? severityFor(1.0)
        : severity.key === "mild"
        ? severityFor(1.6)
        : severity.key === "notable"
        ? severityFor(2.0)
        : severityFor(2.6)
      : severity;

  return (
    <aside className="card card-pad flex flex-col">
      <header className="flex items-center justify-between">
        <span className="h-eyebrow">Day reading</span>
        <StreakBadge streak={streak} />
      </header>

      <button
        onClick={() => setRattle((n) => (n || 0) + 1)}
        className="mt-2 group flex items-center justify-center select-none active:scale-[0.97] hover:scale-[1.02] transition-transform duration-200 rounded-xl py-1"
        title="Tap to rattle the cage"
        aria-label="Rattle the cage"
      >
        <CageGlyph
          intensity={liveIntensity}
          direction={dir}
          severity={liveSeverity.key}
          sizeStyle={{ width: 192, height: 192 }}
        />
      </button>

      <div className="text-center -mt-2">
        <div
          className="font-serif text-[26px] tracking-tight text-[var(--fg)]"
          style={{ lineHeight: 1.1 }}
        >
          {liveSeverity.label}
        </div>
        <div className="text-[12.5px] text-[var(--fg-secondary)] mt-1">
          {liveSeverity.copy}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-eyebrow mb-1">
          Distribution of daily moves · 60d
        </div>
        <BellCurve todayReturn={todayReturn} mean={mean} std={std} />
      </div>

      <p className="text-[11px] text-[var(--fg-tertiary)] mt-4 leading-relaxed">
        {liveSeverity.hint}{" "}
        <span className="opacity-70">Tap the cage to rattle it.</span>
      </p>
    </aside>
  );
}
