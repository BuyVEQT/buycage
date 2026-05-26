import { getDailyHistory, ALLOWED_SYMBOLS, type HistorySize } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await ctx.params;
  const upper = symbol.toUpperCase();
  if (!ALLOWED_SYMBOLS.includes(upper)) {
    return Response.json(
      { error: true, message: `Unknown symbol: ${symbol}` },
      { status: 400 }
    );
  }
  const url = new URL(req.url);
  const sizeParam = url.searchParams.get("size");
  const size: HistorySize = sizeParam === "full" ? "full" : "compact";

  try {
    const data = await getDailyHistory(upper, size);
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=900" },
    });
  } catch (e) {
    return Response.json(
      { error: true, message: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
