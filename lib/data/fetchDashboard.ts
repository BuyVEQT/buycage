// Server-side orchestrator: fetch quotes + daily history for CAGE and all
// five sibling ETFs in one parallel burst. Returns a fully serializable
// payload (no Date objects, only ISO strings) so it can cross the
// server/client boundary via props.

import { getDailyHistory, getQuote } from "./market-data";
import { SYMBOLS } from "./symbols";
import type { HistoricalData, QuoteData } from "./types";

export type DashboardSymbolPayload = {
  ticker: string;
  fullName: string;
  quote: QuoteData | null;
  history: HistoricalData | null;
};

export type DashboardPayload = {
  fetchedAt: string;
  cage: DashboardSymbolPayload;
  siblings: DashboardSymbolPayload[];
};

async function fetchSymbol(
  ticker: string
): Promise<DashboardSymbolPayload> {
  const fullName = SYMBOLS[ticker]?.fullName ?? ticker;
  // Independent — let one failing call not kill the rest.
  const [quoteRes, historyRes] = await Promise.allSettled([
    getQuote(ticker),
    getDailyHistory(ticker, "compact"),
  ]);
  return {
    ticker,
    fullName,
    quote: quoteRes.status === "fulfilled" ? quoteRes.value : null,
    history: historyRes.status === "fulfilled" ? historyRes.value : null,
  };
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  // CAGE first key, then siblings in the order configured.
  const all = Object.keys(SYMBOLS);
  const cageKey = "CAGE";
  const siblingKeys = all.filter((k) => k !== cageKey);

  const [cage, ...siblings] = await Promise.all([
    fetchSymbol(cageKey),
    ...siblingKeys.map(fetchSymbol),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    cage,
    siblings,
  };
}
