// Server-side orchestrator: fetch quotes + daily history for CAGE and all
// five sibling ETFs in one parallel burst. Returns a fully serializable
// payload (no Date objects, only ISO strings) so it can cross the
// server/client boundary via props.

import { getDailyHistory, getQuote } from "./market-data";
import {
  CAGE_SYMBOL,
  COMPARISON_SYMBOLS,
  SIBLING_SYMBOLS,
  SYMBOLS,
} from "./symbols";
import type { HistoricalData, QuoteData } from "./types";
import type { HistorySize } from "./market-data";

export type DashboardSymbolPayload = {
  ticker: string;
  fullName: string;
  quote: QuoteData | null;
  history: HistoricalData | null;
};

export type DashboardPayload = {
  // null only for the empty/fallback payload (no data → no "as of" time). A
  // real fetch always stamps this. Kept nullable so the empty state needn't
  // invent a render-time timestamp, which would break SSR hydration.
  fetchedAt: string | null;
  cage: DashboardSymbolPayload;
  siblings: DashboardSymbolPayload[];
  comparisons: DashboardSymbolPayload[];
};

async function fetchSymbol(
  ticker: string,
  historySize: HistorySize = "compact"
): Promise<DashboardSymbolPayload> {
  const fullName = SYMBOLS[ticker]?.fullName ?? ticker;
  // Independent — let one failing call not kill the rest.
  const [quoteRes, historyRes] = await Promise.allSettled([
    getQuote(ticker),
    getDailyHistory(ticker, historySize),
  ]);
  return {
    ticker,
    fullName,
    quote: quoteRes.status === "fulfilled" ? quoteRes.value : null,
    history: historyRes.status === "fulfilled" ? historyRes.value : null,
  };
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  const [cage, siblings, comparisons] = await Promise.all([
    fetchSymbol(CAGE_SYMBOL, "full"),
    Promise.all(SIBLING_SYMBOLS.map((ticker) => fetchSymbol(ticker))),
    Promise.all(COMPARISON_SYMBOLS.map((ticker) => fetchSymbol(ticker, "full"))),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    cage,
    siblings,
    comparisons,
  };
}
