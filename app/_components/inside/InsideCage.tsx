"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "../overview/Footer";
import { Header, useScrollY } from "../overview/Header";
import { MoneyFlow } from "../overview/MoneyFlow";
import { Reveal, ReturnsTable, SectionHeader } from "../overview/shared";
import { Rhythm } from "../overview/Rhythm";
import { XRay } from "../overview/XRay";

export function InsideCage() {
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
        active="inside"
      />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-10">
        {/* Intro */}
        <section className="mb-12 max-w-[680px]">
          <div className="h-eyebrow mb-2">Inside CAGE</div>
          <h1
            className="font-serif text-[var(--fg)] tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(34px, 4.4vw, 52px)", letterSpacing: "-0.02em" }}
          >
            What the fund-of-funds <em>actually</em> owns — and how it&apos;s
            been moving.
          </h1>
          <p className="text-[14px] text-[var(--fg-secondary)] mt-4 leading-relaxed">
            Hover or click the interactive widgets below. Rhythm shows every
            session of the last 12 weeks. X-Ray decomposes CAGE through its
            five sibling ETFs down to individual stock holdings. Money flow
            lets you slide any dollar amount through the structure to see
            where each cent lands.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors mt-5"
          >
            <span aria-hidden>←</span>
            Back to overview
          </Link>
        </section>

        <Reveal>
          <section
            id="rhythm"
            className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-start scroll-mt-20"
          >
            <Rhythm />
            <div id="xray" className="scroll-mt-20">
              <XRay />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <div id="flow" className="mt-12 scroll-mt-20">
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

// Keep SectionHeader import live (used by sub-modules)
void SectionHeader;
