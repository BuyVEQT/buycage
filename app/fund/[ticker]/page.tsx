import { notFound } from "next/navigation";
import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { SYMBOLS } from "@/lib/data";
import { FundClient } from "@/app/_components/fund/FundClient";

export const revalidate = 60;

const SIBLING_TICKERS = new Set(["CAUS", "CACE", "CADE", "CASV", "CAEM"]);

export async function generateStaticParams() {
  return Array.from(SIBLING_TICKERS).map((ticker) => ({ ticker }));
}

export default async function FundPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();
  if (!SIBLING_TICKERS.has(ticker) || !SYMBOLS[ticker]) notFound();

  const live = await fetchDashboard().catch(() => null);
  return <FundClient live={live} ticker={ticker} />;
}
