// Yahoo Finance client.
//
// Three defenses worth flagging — all of these bit BuyVEQT in production
// (see PRs #38 and #83 in the share packet):
//
//   1. withTimeout — yahoo-finance2's network calls hang occasionally.
//      8–10s timeout is non-negotiable.
//
//   2. End at yesterday — Yahoo's historical endpoint sometimes returns
//      today's row with close: null before the market data finalizes;
//      the library then throws on it. Always cap period2 at yesterday.
//
//   3. Null-close row filter — belt-and-braces in case (2) still leaks.
//
// Suppress the noisy notices the library prints on every call.

import YahooFinance from "yahoo-finance2";
import type { HistoricalData, QuoteData } from "./types";

const yf = new YahooFinance({
  suppressNotices: ["ripHistorical", "yahooSurvey"],
});

const QUOTE_TIMEOUT_MS = 8000;
const HISTORY_TIMEOUT_MS = 10000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timer)
  );
}

export async function getQuoteYahoo(
  yahooSymbol: string,
  displaySymbol: string
): Promise<QuoteData | null> {
  try {
    const result = await withTimeout(
      yf.quote(yahooSymbol),
      QUOTE_TIMEOUT_MS,
      `Yahoo quote for ${yahooSymbol}`
    );
    if (!result || !result.regularMarketPrice) return null;
    return {
      symbol: displaySymbol,
      price: result.regularMarketPrice,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      previousClose: result.regularMarketPreviousClose ?? 0,
      dayHigh: result.regularMarketDayHigh ?? 0,
      dayLow: result.regularMarketDayLow ?? 0,
      volume: result.regularMarketVolume ?? 0,
      marketCap: result.marketCap ?? 0,
      latestTradingDay: result.regularMarketTime
        ? new Date(result.regularMarketTime).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow ?? 0,
      dividendYield: (result.trailingAnnualDividendYield ?? 0) * 100,
      source: "yahoo-finance",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`[Yahoo] Quote failed for ${yahooSymbol}:`, error);
    return null;
  }
}

export async function getHistoryYahoo(
  yahooSymbol: string,
  displaySymbol: string,
  options?: {
    period1?: Date | string;
    period2?: Date | string;
    interval?: "1d" | "1wk" | "1mo";
  }
): Promise<HistoricalData | null> {
  try {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 120);

    // Defense #2 — end at yesterday, not today.
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = options?.period2 ?? yesterday;

    const result = await withTimeout(
      yf.historical(yahooSymbol, {
        period1: options?.period1 ?? defaultStart,
        period2: endDate,
        interval: options?.interval ?? "1d",
      }),
      HISTORY_TIMEOUT_MS,
      `Yahoo history for ${yahooSymbol}`
    );
    if (!result || result.length === 0) return null;

    // Defense #3 — drop any rows with null/zero close that slipped through.
    const cleanRows = result.filter(
      (row) => row.close != null && row.close > 0
    );
    if (cleanRows.length === 0) return null;

    return {
      symbol: displaySymbol,
      data: cleanRows.map((row) => ({
        date: new Date(row.date).toISOString().split("T")[0],
        open: row.open ?? 0,
        high: row.high ?? 0,
        low: row.low ?? 0,
        close: row.close ?? 0,
        adjustedClose: row.adjClose ?? row.close ?? 0,
        volume: row.volume ?? 0,
        dividendAmount: 0,
      })),
      source: "yahoo-finance",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`[Yahoo] History failed for ${yahooSymbol}:`, error);
    return null;
  }
}
