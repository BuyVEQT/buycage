"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRICE } from "./data";
import { IconMoon, IconSun } from "./icons";

// ─── hooks ───────────────────────────────────────────────────────────────────
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function marketStatus(now: Date) {
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

export function useScrollY() {
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
    <Link href="/" className="flex items-baseline gap-1.5">
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
    </Link>
  );
}

type NavKey = "overview" | "inside";
const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "overview", label: "Overview", href: "/" },
  { key: "inside", label: "Inside CAGE", href: "/inside" },
];
const MOCK_NAV = [
  { label: "Holdings", title: "Coming soon" },
  { label: "About", title: "Coming soon" },
];

export function Header({
  theme,
  setTheme,
  compressed,
  active,
}: {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  compressed: boolean;
  active: NavKey;
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
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    isActive
                      ? "text-[var(--fg)] font-medium relative"
                      : "text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors"
                  }
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-[6px] left-0 right-0 h-[2px] rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </Link>
              );
            })}
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
