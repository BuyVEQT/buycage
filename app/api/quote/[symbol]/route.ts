import { getQuote, ALLOWED_SYMBOLS } from "@/lib/data";

// Yahoo/fs need the Node runtime, not Edge.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
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
  try {
    const data = await getQuote(upper);
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    return Response.json(
      { error: true, message: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
