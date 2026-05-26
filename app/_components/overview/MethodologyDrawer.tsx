"use client";

import { useState } from "react";
import { CAGE_META } from "./data";
import { IconBook, IconChevronDown } from "./icons";

export function MethodologyDrawer() {
  const [open, setOpen] = useState(false);
  const inception = new Date(CAGE_META.inception).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-[13px] text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <IconBook size={14} className="text-[var(--fg-tertiary)]" />
          Methodology — how we calculate this
        </span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 300ms var(--ease-out)",
          }}
          className="text-[var(--fg-tertiary)]"
        >
          <IconChevronDown size={14} />
        </span>
      </button>
      <div className="drawer-content" data-open={open}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 pb-8 text-[12.5px] leading-relaxed text-[var(--fg-secondary)]">
          <div>
            <div className="h-eyebrow mb-1.5">Data sources</div>
            <p>
              All figures on this page are illustrative mock data, generated
              client-side from a single source-of-truth object. A production
              BuyCage would pull TSX end-of-day closes from a vendor like
              Refinitiv or Yahoo Finance, with NAV and AUM sourced directly
              from CIBC&apos;s published fund factsheets.
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-1.5">Refresh cadence</div>
            <p>
              Intraday quotes refresh every 15 minutes on TSX hours (9:30 –
              16:00 ET). End-of-day values update once the close prints,
              typically by 17:00 ET. NAV is published end-of-day. AUM updates
              monthly.
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-1.5">Effective weights</div>
            <p>
              CAGE is a fund-of-funds. For each underlying stock we compute its{" "}
              <em>effective weight</em> as the product of (its weight in the
              sibling ETF) × (the sibling ETF&apos;s weight in CAGE). Stocks
              held by more than one sibling are summed across sources. The
              X-Ray and &quot;$X buys&quot; panels use these effective weights.
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-1.5">Day reading &amp; anomalies</div>
            <p>
              Day-move severity is the absolute z-score of today&apos;s
              percentage return against the rolling 60-day distribution.
              Anomaly chips fire when a metric crosses a threshold: volume ≥
              1.5× the 20-day average, price within $0.05 of a 52-week extreme,
              current streak ≥ 4 sessions, or NAV premium/discount ≥ 0.15%.
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-1.5">Returns</div>
            <p>
              Time-weighted total return, net of fees (MER 24 bps).
              Since-inception return is computed from the inception NAV of
              $20.00 on {inception}. Excess return is fund minus benchmark, not
              annualized.
            </p>
          </div>
          <div>
            <div className="h-eyebrow mb-1.5">Disclaimer</div>
            <p>
              BuyCage is an unaffiliated reference dashboard, not a CIBC
              property and not investment advice. Consult a registered advisor
              before investing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
