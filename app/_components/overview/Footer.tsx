"use client";

import { useEffect, useState } from "react";
import { MethodologyDrawer } from "./MethodologyDrawer";

export function Footer() {
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
