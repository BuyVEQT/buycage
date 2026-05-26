// Structured single-line log per fetch. Keep tiny so Vercel logs stay
// readable.

export function logDataFetch(
  source: string,
  symbol: string,
  success: boolean,
  durationMs: number,
  error?: string
) {
  console.log(
    "[MarketData]",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      source,
      symbol,
      success,
      durationMs: Math.round(durationMs),
      ...(error && { error }),
    })
  );
}
