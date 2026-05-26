"use client";

import { useEffect, useState } from "react";
import { Header, useScrollY } from "../overview/Header";
import { Footer } from "../overview/Footer";

/**
 * Placeholder Why CAGE page. Real article content lands in a follow-up
 * commit once the research synthesis is complete.
 */
export function Why() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollY = useScrollY();
  const compressed = scrollY > 60;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Header
        theme={theme}
        setTheme={setTheme}
        compressed={compressed}
        active="why"
      />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-16 pb-24">
        <section className="max-w-[680px]">
          <div className="h-eyebrow mb-3">Why CAGE</div>
          <h1
            className="font-serif text-[var(--fg)] tracking-tight leading-[1]"
            style={{
              fontSize: "clamp(40px, 6vw, 76px)",
              letterSpacing: "-0.025em",
            }}
          >
            Article landing soon.
          </h1>
          <p className="text-[15px] text-[var(--fg-secondary)] mt-6 leading-relaxed">
            A long-form take on what CAGE actually does differently —
            value + profitability tilting, the Avantis methodology, why a
            Canadian-listed factor-tilted all-equity ETF matters, and how it
            compares head-to-head with VEQT / XEQT. Drafted from the
            factsheet, Avantis whitepapers, DFA + Fama–French research, and
            PWL Capital / Ben Felix&apos;s Canadian evidence-based work.
          </p>
        </section>

        <Footer />
      </main>
    </div>
  );
}
