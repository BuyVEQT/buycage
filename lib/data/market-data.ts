// Orchestrator. Policy per call:
//
//   1. Hit Yahoo upstream — cache the success
//   2. Read local cache — mark source='cache' so the UI can show a stale
//      hint
//   3. Throw if both miss, so the caller can render an empty state
//
// (BuyVEQT layers Alpha Vantage as a secondary; BuyCage starts Yahoo-only.
// Adding AV later means slotting it in between steps 1 and 2.)

import { getCacheKey, readCache, writeCache } from "./cache";
import { logDataFetch } from "./logger";
import { SYMBOLS, type SymbolConfig } from "./symbols";
import type { HistoricalData, QuoteData } from "./types";
import { getHistoryYahoo, getQuoteYahoo } from "./yahoo-fallback";

export type HistorySize = "compact" | "full";

function resolveSymbol(symbol: string): SymbolConfig {
  const config = SYMBOLS[symbol.toUpperCase()];
  if (!config) throw new Error(`Unknown symbol: ${symbol}`);
  return config;
}

// ─── quote ──────────────────────────────────────────────────────────────────
export async function getQuote(symbol: string): Promise<QuoteData> {
  const config = resolveSymbol(symbol);
  const cacheKey = getCacheKey("quote", config.displayName);

  const start = Date.now();
  const fresh = await getQuoteYahoo(config.yahoo, config.displayName);
  logDataFetch("yahoo", config.displayName, fresh !== null, Date.now() - start);
  if (fresh) {
    await writeCache(cacheKey, fresh);
    return fresh;
  }

  const cached = await readCache<QuoteData>(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  throw new Error(`Yahoo unavailable for ${symbol} and no cache`);
}

// ─── history ────────────────────────────────────────────────────────────────
export async function getDailyHistory(
  symbol: string,
  size: HistorySize = "compact"
): Promise<HistoricalData> {
  const config = resolveSymbol(symbol);
  const cacheKey = getCacheKey("history-daily", config.displayName, size);

  const now = new Date();
  const period1 = new Date(now);
  // 'compact' ≈ 100 trading days, 'full' ≈ 20 years
  period1.setDate(period1.getDate() - (size === "full" ? 365 * 20 : 150));

  const start = Date.now();
  const fresh = await getHistoryYahoo(config.yahoo, config.displayName, {
    period1,
    interval: "1d",
  });
  logDataFetch(
    "yahoo",
    `${config.displayName}/history-${size}`,
    fresh !== null && fresh.data.length > 0,
    Date.now() - start
  );
  // Guard against empty-data cache poisoning (PR #83 lesson).
  if (fresh && fresh.data.length > 0) {
    await writeCache(cacheKey, fresh);
    return fresh;
  }

  const cached = await readCache<HistoricalData>(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  throw new Error(`Yahoo unavailable for ${symbol} history and no cache`);
}

export async function getMonthlyHistory(
  symbol: string
): Promise<HistoricalData> {
  const config = resolveSymbol(symbol);
  const cacheKey = getCacheKey("history-monthly", config.displayName);

  const now = new Date();
  const period1 = new Date(now);
  period1.setFullYear(period1.getFullYear() - 20);

  const start = Date.now();
  const fresh = await getHistoryYahoo(config.yahoo, config.displayName, {
    period1,
    interval: "1mo",
  });
  logDataFetch(
    "yahoo",
    `${config.displayName}/history-monthly`,
    fresh !== null && fresh.data.length > 0,
    Date.now() - start
  );
  if (fresh && fresh.data.length > 0) {
    await writeCache(cacheKey, fresh);
    return fresh;
  }

  const cached = await readCache<HistoricalData>(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  throw new Error(`Yahoo unavailable for ${symbol} monthly history and no cache`);
}
