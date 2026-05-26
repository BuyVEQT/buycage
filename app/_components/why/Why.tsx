"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "../overview/Footer";
import { Header, useScrollY } from "../overview/Header";

/**
 * Long-form Why CAGE article. Editorial tone, more vibrant visual
 * treatment than the dashboard — colored section markers, big serif
 * headlines, pull-quotes, stat callouts.
 *
 * Researched from: CIBC factsheet, Avantis whitepapers + Repetto/Wahal
 * paper, Fama-French 2015 / Novy-Marx 2013, AQR (Asness et al. 2015),
 * Rational Reminder Podcast Ep 401 (Repetto + Ebanks), PWL Capital
 * "Five Factor Investing with ETFs", Globe and Mail coverage.
 */

function SectionNumber({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span
        className="font-serif italic num leading-none"
        style={{
          fontSize: "clamp(36px, 4vw, 56px)",
          color: "var(--accent)",
          letterSpacing: "-0.02em",
        }}
      >
        {n}
      </span>
      <span className="h-eyebrow">{label}</span>
    </div>
  );
}

function PullQuote({
  children,
  cite,
}: {
  children: React.ReactNode;
  cite: string;
}) {
  return (
    <blockquote
      className="my-10 pl-6 border-l-[3px] py-2"
      style={{ borderColor: "var(--accent)" }}
    >
      <p
        className="font-serif italic text-[var(--fg)] leading-[1.35]"
        style={{ fontSize: "clamp(20px, 2.2vw, 28px)" }}
      >
        {children}
      </p>
      <footer className="mt-3 text-[12px] text-[var(--fg-tertiary)] uppercase tracking-[0.14em]">
        — {cite}
      </footer>
    </blockquote>
  );
}

function StatCallout({
  big,
  label,
  tone = "accent",
}: {
  big: string;
  label: string;
  tone?: "accent" | "gain" | "loss";
}) {
  const color =
    tone === "gain"
      ? "var(--gain)"
      : tone === "loss"
      ? "var(--loss)"
      : "var(--accent)";
  return (
    <div
      className="card card-pad text-center"
      style={{
        background: `color-mix(in srgb, ${color} 8%, var(--surface-1))`,
        borderColor: `color-mix(in srgb, ${color} 30%, var(--border))`,
      }}
    >
      <div
        className="font-serif tracking-tight num"
        style={{
          fontSize: "clamp(34px, 4vw, 48px)",
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {big}
      </div>
      <div className="text-[12px] text-[var(--fg-secondary)] mt-2 leading-snug">
        {label}
      </div>
    </div>
  );
}

function Citation({ n, href, children }: { n: number; href: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="font-mono text-[10px] text-[var(--fg-tertiary)] num mt-1 min-w-[24px]">
        [{n}]
      </span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-[13px] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors underline decoration-[var(--border-strong)] underline-offset-2 hover:decoration-[var(--accent)]"
      >
        {children}
      </a>
    </li>
  );
}

const PROSE = "text-[15.5px] text-[var(--fg-secondary)] leading-[1.65] [&>p]:mb-4 [&_strong]:text-[var(--fg)] [&_em]:italic [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:decoration-[color-mix(in_srgb,var(--accent)_40%,transparent)] [&_a]:underline-offset-2";

export function Why() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollY = useScrollY();
  const compressed = scrollY > 60;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {/* Decorative accent wash at the top of the page */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[480px] pointer-events-none -z-0"
        style={{
          background:
            "radial-gradient(60% 100% at 20% 0%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%), radial-gradient(50% 80% at 90% 10%, color-mix(in srgb, var(--slice-intl) 10%, transparent) 0%, transparent 65%)",
        }}
      />

      <Header
        theme={theme}
        setTheme={setTheme}
        compressed={compressed}
        active="why"
      />

      <main className="relative max-w-[920px] mx-auto px-4 sm:px-6">
        {/* ─── Hero ─── */}
        <section className="pt-16 pb-12">
          <div className="h-eyebrow mb-4">Why CAGE</div>
          <h1
            className="font-serif text-[var(--fg)] tracking-tight leading-[0.95]"
            style={{
              fontSize: "clamp(48px, 8vw, 92px)",
              letterSpacing: "-0.03em",
            }}
          >
            The world&apos;s equities,{" "}
            <span
              className="italic"
              style={{ color: "var(--accent)" }}
            >
              tilted on purpose.
            </span>
          </h1>
          <p
            className="mt-8 text-[var(--fg-secondary)] leading-[1.55] max-w-[680px]"
            style={{ fontSize: "clamp(17px, 1.8vw, 21px)" }}
          >
            CAGE is the first Canadian-listed one-ticket way to express the
            full evidence-based playbook: a 100% global equity allocation,
            tilted toward companies that are <em>cheaper</em> and{" "}
            <em>more profitable</em> than the market average. At 0.28 % per
            year. That sentence used to require a US brokerage, four separate
            ETFs, and a tax spreadsheet.
          </p>
        </section>

        {/* ─── Pull quote ─── */}
        <PullQuote cite="Ben Felix, Rational Reminder Ep. 401">
          We had complicated model portfolios where we could say, okay, here,
          now you DIY investor… you can invest the way we talk about. But it
          was fairly complex and required US-listed ETFs and currency
          conversion. With CAGE, that barrier is gone.
        </PullQuote>

        {/* ─── Section 01 ─── */}
        <section className="py-12">
          <SectionNumber n="01" label="The philosophy" />
          <h2
            className="font-serif text-[var(--fg)] tracking-tight mb-6"
            style={{ fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-0.02em" }}
          >
            Why cheap + profitable, not cheap alone
          </h2>

          <div className={PROSE}>
            <p>
              The starting point for the Avantis philosophy is the dividend
              discount model rearranged for expected returns. If you know a
              company&apos;s price, its book equity, and its expected future
              cash profits, you can infer the discount rate the market is
              applying — and a higher discount rate is, in equilibrium, a
              higher expected return. Market-cap-weighted indexes only use
              price. Avantis blends price with book equity and a profitability
              measure to score every stock in its investable universe.
            </p>
            <p>
              The academic foundation for the second variable — profitability —
              is more recent than the value premium itself. Robert
              Novy-Marx&apos;s 2013 paper{" "}
              <em>The Other Side of Value: The Gross Profitability Premium</em>{" "}
              showed that gross profits scaled by assets has roughly the same
              power as book-to-price in predicting cross-sectional returns, and
              that the two together do meaningfully better than either alone.
              Fama and French formalised this in their 2015 five-factor model,
              adding profitability (RMW) and investment (CMA) factors to the
              original three. The five-factor model explains away most of what
              looks like a value premium among small caps that ignored
              profitability — the problem of <em>value traps</em>.
            </p>
            <p>
              Avantis CIO Eduardo Repetto&apos;s own 2020 paper with Sunil
              Wahal of Arizona State sharpened this for practitioners. Sorting
              international stocks 1990&ndash;2020 into corners of the
              value/profitability grid, they found that the
              high-value/high-profitability corner outperformed the
              low-value/low-profitability corner by enormous margins — in
              emerging-market small caps, roughly 16.5 % annualised vs. 1.1 %.
              The lesson Avantis takes from this is that value and
              profitability are not two factors to be stacked; they are jointly
              identifying the same theoretical object — a higher discount rate
              — and must be implemented together.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <StatCallout big="16.5%" label="annualised return — high-value × high-profitability EM small caps, 1990–2020" tone="gain" />
            <StatCallout big="1.1%" label="annualised return — low-value × low-profitability corner, same window" tone="loss" />
            <StatCallout big="50/50" label="Avantis weights value and profitability roughly equally per stock" />
          </div>
        </section>

        {/* ─── Section 02 ─── */}
        <section className="py-12">
          <SectionNumber n="02" label="The implementation" />
          <h2
            className="font-serif text-[var(--fg)] tracking-tight mb-6"
            style={{ fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-0.02em" }}
          >
            Daily, opportunistic, cost-aware
          </h2>

          <div className={PROSE}>
            <p>
              The implementation differences from a typical index fund are
              where Avantis becomes distinctive. A value index such as the
              Russell 1000 Value rebalances on a fixed schedule, holds
              everything that screens &ldquo;value&rdquo; at the reconstitution
              date in proportion to market cap, and only revisits the question
              once or twice a year. Avantis evaluates every name in the
              portfolio <strong>daily</strong>, scoring it on the joint
              value/profitability metric, then asks whether the expected return
              improvement from trading toward the model weight exceeds the
              actual cost of execution — commissions, bid-ask spreads, market
              impact. Trades only happen when the answer is yes.
            </p>
            <p>
              That sounds simple, but it is the practical mechanism that
              addresses one of the long-standing problems with capturing the
              value premium: stale, calendar-based rebalancing forces buying or
              selling on dates when the market is already crowded into the same
              trade.
            </p>
            <p>
              Several smaller choices stack up: Avantis uses{" "}
              <em>cash profitability</em> rather than operating profitability
              (less manipulable through accruals); they strip goodwill from
              book equity to neutralise the accounting distortion of
              acquisitive companies; they cap any sector at 30 % and apply a
              roughly three-month lag on the value metric so they don&apos;t
              buy stocks whose prices are still falling on adverse news. Each
              is small in isolation; the cumulative effect is a portfolio with
              meaningfully stronger factor loadings than a passive value index
              at roughly the same expense ratio.
            </p>
            <p>
              Repetto resists the &ldquo;factor&rdquo; label for what Avantis
              does. The model is built on financial science, but the daily,
              cost-aware implementation looks more like systematic active
              management than the rebalance-once-a-year mechanism most
              investors associate with index-style factor funds.
            </p>
          </div>
        </section>

        {/* ─── Section 03 ─── */}
        <section className="py-12">
          <SectionNumber n="03" label="The Canadian angle" />
          <h2
            className="font-serif text-[var(--fg)] tracking-tight mb-6"
            style={{ fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-0.02em" }}
          >
            Why Canadians had to wait
          </h2>

          <div className={PROSE}>
            <p>
              If you&apos;ve spent any time around Ben Felix&apos;s YouTube
              channel, the Rational Reminder Podcast, or PWL Capital&apos;s
              white papers, the CIBC&ndash;Avantis launch wasn&apos;t just
              another fund family arriving in Canada. It was the closing of a
              gap the Canadian evidence-based community had been working around
              for the better part of a decade.
            </p>
            <p>
              PWL&apos;s white paper <em>Five Factor Investing with ETFs</em>,
              authored by Felix, makes the case that a globally diversified
              portfolio of broad-market funds is a defensible starting point,
              but that decades of empirical work give investors evidence-based
              reasons to expect modestly higher long-term returns from tilts
              toward value, size and profitability. The white paper proposes a
              model portfolio designed to capture all five factors — and
              Felix&apos;s published Canadian model historically pieced this
              together with a base of XIC, VUN, XEF and XEC, plus Avantis
              sleeves like AVUV and AVDV for the small-value tilt.
            </p>
            <p>
              That last part is where Canadian DIY investors hit a wall. Until
              CIBC and Avantis brought their suite to the TSX in early 2026,
              capturing those factor premia meant opening a USD-denominated
              brokerage account, paying currency conversion to buy AVUV and
              AVDV, and managing the resulting tax-treaty paperwork. As Felix
              told the Globe and Mail, &ldquo;the pent-up demand for something
              like this in Canada was huge,&rdquo; describing the underlying
              approach as &ldquo;academically supported improvements to the
              concept of index investing.&rdquo;
            </p>
          </div>

          <PullQuote cite="Eduardo Repetto, Avantis Investors CIO">
            If you want higher expected returns, you need fundamental data.
          </PullQuote>

          <div className={PROSE}>
            <p>
              There&apos;s a less glamorous but very Canadian reason this
              lineup matters. A US-listed Avantis ETF held in an RRSP escapes
              the 15 % US withholding tax on US dividends thanks to the
              Canada&ndash;US tax treaty — fine for the US sleeve, but
              international and emerging-markets sleeves still get hit. A
              Canadian-listed wrapper that holds the underlying foreign stocks
              directly (rather than wrapping a US-listed fund) avoids the
              double-layer of withholding that catches a lot of Canadian
              &ldquo;international&rdquo; products. The CIBC&ndash;Avantis
              structure is built natively in Canada, which simplifies that
              whole calculation for TFSAs, RRSPs and non-registered accounts
              alike.
            </p>
          </div>
        </section>

        {/* ─── Section 04 ─── */}
        <section className="py-12">
          <SectionNumber n="04" label="Head-to-head" />
          <h2
            className="font-serif text-[var(--fg)] tracking-tight mb-6"
            style={{ fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-0.02em" }}
          >
            CAGE vs VEQT vs XEQT
          </h2>

          <div className={PROSE}>
            <p>
              The structural geography is closer than you might assume. CAGE
              keeps a Canadian weight in line with VEQT (~30 %), which sits at
              the high end of the 25&ndash;35 % home-bias range that PWL and
              Vanguard&apos;s own research suggest is sensible for Canadians.
              XEQT is leaner on Canada (~25 %) and heavier on international
              developed. The real geographic distinction with CAGE is the
              dedicated ~8 % sleeve in CASV (Global Small Cap Value), which
              neither VEQT nor XEQT carries in any meaningful way.
            </p>
          </div>

          <div className="card overflow-x-auto mt-6">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="h-eyebrow border-b border-[var(--border)]">
                  <th className="text-left font-normal px-4 py-3"> </th>
                  <th className="text-right font-normal px-4 py-3" style={{ color: "var(--accent)" }}>CAGE</th>
                  <th className="text-right font-normal px-4 py-3">VEQT</th>
                  <th className="text-right font-normal px-4 py-3">XEQT</th>
                  <th className="text-right font-normal px-4 py-3">AVGE (US)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] num">
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">Mgmt fee</td><td className="px-4 py-3 text-right text-[var(--fg)]">0.28%</td><td className="px-4 py-3 text-right">0.17%</td><td className="px-4 py-3 text-right">0.17%</td><td className="px-4 py-3 text-right">0.23%</td></tr>
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">US equities</td><td className="px-4 py-3 text-right text-[var(--fg)]">~40%</td><td className="px-4 py-3 text-right">~45%</td><td className="px-4 py-3 text-right">~45%</td><td className="px-4 py-3 text-right">~70%</td></tr>
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">Canada</td><td className="px-4 py-3 text-right text-[var(--fg)]">30.0%</td><td className="px-4 py-3 text-right">~31%</td><td className="px-4 py-3 text-right">~25%</td><td className="px-4 py-3 text-right">0%</td></tr>
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">Intl developed</td><td className="px-4 py-3 text-right text-[var(--fg)]">17.6%</td><td className="px-4 py-3 text-right">~20%</td><td className="px-4 py-3 text-right">~25%</td><td className="px-4 py-3 text-right">~17%</td></tr>
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">Emerging</td><td className="px-4 py-3 text-right text-[var(--fg)]">5.0%</td><td className="px-4 py-3 text-right">~5%</td><td className="px-4 py-3 text-right">~5%</td><td className="px-4 py-3 text-right">~10%</td></tr>
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">Small-cap value</td><td className="px-4 py-3 text-right text-[var(--fg)]">8.0%</td><td className="px-4 py-3 text-right">—</td><td className="px-4 py-3 text-right">—</td><td className="px-4 py-3 text-right">embedded</td></tr>
                <tr><td className="px-4 py-3 text-[var(--fg-tertiary)]">Method</td><td className="px-4 py-3 text-right text-[var(--fg)]">Daily factor tilt</td><td className="px-4 py-3 text-right">Cap-weighted</td><td className="px-4 py-3 text-right">Cap-weighted</td><td className="px-4 py-3 text-right">Daily factor tilt</td></tr>
              </tbody>
            </table>
          </div>

          <div className={PROSE + " mt-8"}>
            <p>
              <strong>Is the MER gap justified?</strong> Be honest with
              yourself. CAGE at 0.28 % is meaningfully higher than VEQT/XEQT at
              0.17 %. On a $100 000 portfolio that&apos;s roughly an extra
              $100&ndash;110 a year. The case for paying it: daily,
              opportunistic security selection (not annual rebalance),
              book-value and profitability screens with nearly a century of
              out-of-sample evidence, and an explicit small-cap-value tilt
              you&apos;d otherwise have to construct yourself with three or
              four separate ETFs. The case against: factor premia, if they
              exist, typically require 15+ year holding periods to show up
              reliably; the US small-cap-value premium has trailed the S&amp;P
              500 for two decades. If you can&apos;t honestly say you&apos;d
              sit through five years of underperformance without switching,
              don&apos;t own CAGE. Tracking error is the price of admission.
            </p>
          </div>
        </section>

        {/* ─── Section 05 ─── */}
        <section className="py-12">
          <SectionNumber n="05" label="The honest answer" />
          <h2
            className="font-serif text-[var(--fg)] tracking-tight mb-6"
            style={{ fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-0.02em" }}
          >
            Who CAGE is actually for
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 mb-8">
            <StatCallout big="1.5–2%" label="annual expected outperformance vs cap-weighted, per Avantis" tone="gain" />
            <StatCallout big="3–4%" label="tracking error you have to sit through" tone="loss" />
            <StatCallout big="15+ yr" label="realistic horizon for factor premia to compound" />
          </div>

          <div className={PROSE}>
            <p>
              In the same Rational Reminder conversation, Repetto laid out
              Avantis&apos;s expectations in unusually concrete terms: roughly
              1.5&ndash;2 % of annual outperformance over a cap-weighted
              benchmark, with 3&ndash;4 % tracking error and significant noise
              around any realised outcome. The mechanism is the kind of
              measured deviation Avantis is known for — shifts of about 15 %
              underweight and 15 % overweight away from low-profitability,
              expensive stocks and toward cheaper, more profitable ones.
            </p>
            <p>
              <strong>CAGE is the right choice if</strong> you already own a
              factor-tilted portfolio (or wanted to build one) and would prefer
              a single ticker instead of juggling AVUV, AVDV, AVES and AVEM
              yourself in a Canadian-friendly wrapper. It&apos;s the right
              choice if you have a genuinely long horizon, believe the academic
              evidence on value and profitability, and can sit through
              stretches where market-cap indexes beat you.
            </p>
            <p>
              <strong>It&apos;s the wrong choice if</strong> your reaction to
              CAGE underperforming XEQT by 4 % over a year would be to switch.
              In that case, the cheapest market-cap portfolio you&apos;ll
              actually hold for 30 years beats the theoretically optimal factor
              portfolio you abandon after two.
            </p>
            <p>
              For most Canadians picking their first one-ticket equity ETF and
              wanting a hands-off solution, XEQT and VEQT remain hard to argue
              with. CAGE is a more specific tool for a more specific investor —
              and now, for the first time, it&apos;s available without the
              currency-conversion-and-tax-spreadsheet tax.
            </p>
          </div>
        </section>

        {/* ─── Sources ─── */}
        <section className="py-12 border-t border-[var(--border)]">
          <div className="h-eyebrow mb-4">Sources</div>
          <ol className="space-y-3">
            <Citation n={1} href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2287202">
              Fama, E. F. and French, K. R. (2015). &ldquo;A Five-Factor Asset Pricing Model.&rdquo; Journal of Financial Economics, Vol. 116.
            </Citation>
            <Citation n={2} href="https://www.sciencedirect.com/science/article/abs/pii/S0304405X13000044">
              Novy-Marx, R. (2013). &ldquo;The Other Side of Value: The Gross Profitability Premium.&rdquo; Journal of Financial Economics.
            </Citation>
            <Citation n={3} href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3739571">
              Wahal, S. and Repetto, E. (2020). &ldquo;The Joint Distribution of Value and Profitability: International Evidence.&rdquo; SSRN.
            </Citation>
            <Citation n={4} href="https://www.aqr.com/-/media/AQR/Documents/Journal-Articles/JPM-Fact-Fiction-and-Value-Investing.pdf">
              Asness, C., Frazzini, A., Israel, R. and Moskowitz, T. (2015). &ldquo;Fact, Fiction, and Value Investing.&rdquo; AQR.
            </Citation>
            <Citation n={5} href="https://pwlcapital.com/episode-401-eduardo-repetto-caitlin-ebanks-opening-the-avantis-cage/">
              Rational Reminder Podcast Ep. 401 — Eduardo Repetto &amp; Caitlin Ebanks: Opening the Avantis CAGE (PWL Capital).
            </Citation>
            <Citation n={6} href="https://pwlcapital.com/wp-content/uploads/2024/08/Five-Factor-Investing-with-ETFs.pdf">
              Felix, B. &ldquo;Five Factor Investing with ETFs.&rdquo; PWL Capital white paper.
            </Citation>
            <Citation n={7} href="https://www.theglobeandmail.com/investing/markets/inside-the-market/article-cage-avantis-cibc-etf-investing-stock/">
              &ldquo;JustBuyCAGE: Why Canadian investors are flocking to this ETF.&rdquo; The Globe and Mail.
            </Citation>
            <Citation n={8} href="https://canadianportfoliomanagerblog.com/part-i-foreign-withholding-taxes-for-equity-etfs/">
              Bender, J. &ldquo;Foreign Withholding Taxes for Equity ETFs.&rdquo; Canadian Portfolio Manager Blog (PWL Capital).
            </Citation>
            <Citation n={9} href="https://res.americancentury.com/docs/inst-avantis-scientific-approach-to-investing.pdf">
              Avantis Investors / American Century. &ldquo;A Scientific Approach to Investing.&rdquo;
            </Citation>
            <Citation n={10} href="https://www.cibc.com/en/personal-banking/investments/etfs/avantis-all-equity-asset-allocation-etf.html">
              CIBC — Avantis CIBC All-Equity Asset Allocation ETF product page.
            </Citation>
          </ol>
        </section>

        {/* CTA back */}
        <section className="py-8 mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-md border border-[var(--border)] text-[14px] text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
          >
            <span aria-hidden>←</span>
            Back to the live CAGE dashboard
          </Link>
        </section>

        <Footer />
      </main>
    </div>
  );
}
