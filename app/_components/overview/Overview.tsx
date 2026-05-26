"use client";

import { useEffect, useState } from "react";
import { CAGE_META, PRICE, SERIES } from "./data";
import {
  IconArrowDown,
  IconArrowUp,
  IconMoon,
  IconSun,
} from "./icons";
import {
  AnimatedNumber,
  Reveal,
  ReturnsTable,
  SectionHeader,
  SnapshotGrid,
  Sparkline,
} from "./shared";
import { AnomalyRow } from "./AnomalyRow";
import { TodaysBrief } from "./TodaysBrief";
import { SinceLastVisit } from "./SinceLastVisit";
import { PriceChart } from "./PriceChart";
import { DayVitals } from "./DayVitals";
import { Leaderboard } from "./Leaderboard";
import { Rhythm } from "./Rhythm";
import { XRay } from "./XRay";
import { MoneyFlow } from "./MoneyFlow";
import { MethodologyDrawer } from "./MethodologyDrawer";

// ─── hooks ───────────────────────────────────────────────────────────────────
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function marketStatus(now: Date) {
  const day = now.getDay();
  if (day === 0 || day === 6)
    return { open: false, label: "Market closed", sub: "Weekend" };
  const mins = now.getHours() * 60 + now.getMinutes();
  const openAt = 9 * 60 + 30;
  const closeAt = 16 * 60;
  if (mins < openAt)
    return { open: false, label: "Pre-market", sub: "Opens 9:30 ET" };
  if (mins >= closeAt)
    return { open: false, label: "Market closed", sub: "After hours" };
  return { open: true, label: "Market open", sub: "TSX" };
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const on = () => setY(window.scrollY);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return y;
}

// ─── pieces ─────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ReturnType<typeof marketStatus> }) {
  return (
    <span className="inline-flex items-center gap-2 px-2.5 h-7 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[11px] text-[var(--fg-secondary)]">
      <span className="relative flex h-1.5 w-1.5">
        {status.open && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--gain)] opacity-60 animate-ping" />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{
            background: status.open ? "var(--gain)" : "var(--fg-tertiary)",
          }}
        />
      </span>
      <span className="font-medium text-[var(--fg)]">{status.label}</span>
      <span className="text-[var(--fg-tertiary)]">·</span>
      <span>{status.sub}</span>
    </span>
  );
}

function Wordmark({ compact }: { compact: boolean }) {
  return (
    <a href="#" className="flex items-baseline gap-1.5">
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
          fontSize: compact ? 16 : 18,
          color: "var(--fg)",
        }}
      >
        Buy<span style={{ color: "var(--accent)" }}>Cage</span>
      </span>
      <span className="wordmark-tag text-[10px] text-[var(--fg-tertiary)] tracking-[0.18em] uppercase mb-[2px]">
        .ca
      </span>
    </a>
  );
}

const MOCK_NAV = [
  { label: "Holdings", title: "Coming soon" },
  { label: "Performance", title: "Coming soon" },
  { label: "About", title: "Coming soon" },
];

function Header({
  theme,
  setTheme,
  compressed,
}: {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  compressed: boolean;
}) {
  const now = useNow();
  const status = now
    ? marketStatus(now)
    : { open: false, label: "Market closed", sub: "" };
  const stamp =
    now &&
    now.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  const isGain = PRICE.dayChange >= 0;

  return (
    <header
      className={
        "sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 " +
        (compressed ? "hdr-shrink" : "")
      }
      style={{
        background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        borderColor: compressed ? "var(--border)" : "transparent",
        height: compressed ? 48 : 56,
      }}
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Wordmark compact={compressed} />
          <nav className="hidden md:flex items-center gap-5 text-[12.5px]">
            <a
              className="text-[var(--fg-secondary)] hover:text-[var(--fg)] cursor-pointer"
              href="#"
            >
              Overview
            </a>
            {MOCK_NAV.map((item) => (
              <span
                key={item.label}
                title={item.title}
                aria-disabled="true"
                className="text-[var(--fg-tertiary)] opacity-50 cursor-not-allowed select-none flex items-center gap-1.5"
              >
                {item.label}
                <span className="text-[9px] uppercase tracking-[0.14em] text-[var(--fg-tertiary)] border border-[var(--border)] rounded-sm px-1 py-px leading-none opacity-80">
                  soon
                </span>
              </span>
            ))}
          </nav>
          <div
            className="hidden md:flex items-center gap-2 text-[12px] num pl-4 ml-2 border-l border-[var(--border)] transition-opacity"
            style={{
              opacity: compressed ? 1 : 0,
              pointerEvents: compressed ? "auto" : "none",
            }}
          >
            <span className="font-mono text-[var(--fg-tertiary)]">CAGE</span>
            <span className="text-[var(--fg)]">${PRICE.current.toFixed(2)}</span>
            <span
              className={
                isGain ? "text-[var(--gain)]" : "text-[var(--loss)]"
              }
            >
              {isGain ? "+" : ""}
              {PRICE.dayChangePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <StatusPill status={status} />
          {stamp && (
            <span className="hidden sm:inline text-[11px] text-[var(--fg-tertiary)] num">
              {stamp}
            </span>
          )}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-md hover:bg-[var(--surface-1)] flex items-center justify-center text-[var(--fg-secondary)] transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const isGain = PRICE.dayChange >= 0;
  const color = isGain ? "var(--gain)" : "var(--loss)";

  return (
    <section className="pt-10 pb-2">
      <div className="flex items-center gap-3 text-[12px] flex-wrap">
        <span className="font-mono tracking-wide text-[var(--fg-tertiary)] uppercase">
          {CAGE_META.exchange}:{CAGE_META.ticker}
        </span>
        <span className="h-3 w-px bg-[var(--border-strong)]" />
        <span className="text-[var(--fg-tertiary)]">{CAGE_META.currency}</span>
        <span className="h-3 w-px bg-[var(--border-strong)]" />
        <span className="text-[var(--fg-tertiary)] truncate max-w-[420px]">
          {CAGE_META.name}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-8 gap-y-3 items-end">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[var(--fg-tertiary)] text-[28px] leading-none font-serif">
            $
          </span>
          <span
            className="font-serif text-[var(--fg)] tracking-tight leading-none num"
            style={{
              fontSize: "clamp(56px, 7vw, 88px)",
              letterSpacing: "-0.02em",
            }}
          >
            <AnimatedNumber value={PRICE.current} decimals={2} duration={800} />
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 h-7 rounded-md num text-[13px] font-medium ml-2 self-center"
            style={{
              color,
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
            }}
          >
            {isGain ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />}
            <span>
              {isGain ? "+" : ""}${Math.abs(PRICE.dayChange).toFixed(2)}
            </span>
            <span className="opacity-60">·</span>
            <span>
              {isGain ? "+" : ""}
              {PRICE.dayChangePct.toFixed(2)}%
            </span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-[11.5px] text-[var(--fg-tertiary)] num border-l border-[var(--border)] pl-6 self-center">
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">Prev close</span>
            <span className="text-[var(--fg)] text-[13px]">
              ${PRICE.prevClose.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">Open</span>
            <span className="text-[var(--fg)] text-[13px]">
              ${PRICE.open.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">Volume</span>
            <span className="text-[var(--fg)] text-[13px]">
              {(PRICE.volume / 1000).toFixed(1)}K
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="h-eyebrow">AUM</span>
            <span className="text-[var(--fg)] text-[13px]">
              ${(PRICE.aum / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>

        <div className="flex items-end justify-end gap-2 self-center">
          <Sparkline
            data={SERIES["1D"]}
            color={color}
            width={132}
            height={36}
          />
        </div>
      </div>

      <AnomalyRow />
    </section>
  );
}

function Footer() {
  const [stamp, setStamp] = useState<string | null>(null);
  useEffect(() => {
    setStamp(
      new Date().toLocaleString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, []);
  return (
    <footer className="mt-24 pt-2 text-[12px] text-[var(--fg-tertiary)]">
      <MethodologyDrawer />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 pt-6 pb-16 border-t border-[var(--border)]">
        <p className="max-w-[680px] leading-relaxed">
          BuyCage is an unaffiliated reference dashboard for the Avantis CIBC
          All-Equity Asset Allocation ETF ($CAGE). All figures shown are
          illustrative mock data. Nothing here is investment advice, a
          recommendation, or an offer to buy or sell any security. Consult a
          registered advisor before investing. Past performance does not
          predict future results.
        </p>
        <div className="md:text-right space-y-1 num">
          {stamp && <div>Data as of {stamp} ET</div>}
          <div className="text-[var(--fg-tertiary)] opacity-70">
            buycage.ca · built for retail readers
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export function Overview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollY = useScrollY();
  const compressed = scrollY > 60;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Header theme={theme} setTheme={setTheme} compressed={compressed} />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <SinceLastVisit />
        <Hero />
        <TodaysBrief />

        <Reveal>
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            <div className="card card-pad min-w-0">
              <PriceChart />
            </div>
            <DayVitals />
          </section>
        </Reveal>

        <Reveal>
          <SnapshotGrid />
        </Reveal>

        <Reveal>
          <Leaderboard />
        </Reveal>

        <Reveal>
          <section className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-start">
            <Rhythm />
            <XRay />
          </section>
        </Reveal>

        <Reveal>
          <div className="mt-12">
            <MoneyFlow />
          </div>
        </Reveal>

        <Reveal>
          <ReturnsTable />
        </Reveal>

        <Footer />
      </main>
    </div>
  );
}

// suppress unused import warnings — `SectionHeader` is re-exported by sub-modules
// but TS sees it as unused here; an explicit reference keeps the import live.
void SectionHeader;
