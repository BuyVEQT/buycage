// One-shot endpoint that hits every configured symbol in parallel.
// Useful for verifying the symbols config + sanity-checking which tickers
// Yahoo actually recognizes. Don't use this from the UI — too coarse.

import { ALLOWED_SYMBOLS, getQuote, SYMBOLS } from "@/lib/data";

export const runtime = "nodejs";

export async function GET() {
  const results = await Promise.allSettled(
    ALLOWED_SYMBOLS.map(async (sym) => {
      const cfg = SYMBOLS[sym];
      try {
        const quote = await getQuote(sym);
        return {
          symbol: sym,
          yahoo: cfg.yahoo,
          ok: true,
          source: quote.source,
          price: quote.price,
          changePercent: quote.changePercent,
        };
      } catch (e) {
        return {
          symbol: sym,
          yahoo: cfg.yahoo,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  const out = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { ok: false, error: String(r.reason) }
  );

  return Response.json(
    {
      fetchedAt: new Date().toISOString(),
      summary: {
        total: out.length,
        ok: out.filter((r) => r.ok).length,
        failed: out.filter((r) => !r.ok).length,
      },
      results: out,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
