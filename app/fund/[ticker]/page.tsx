import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { SYMBOLS } from "@/lib/data";
import { FundClient } from "@/app/_components/fund/FundClient";
import { JsonLd } from "@/app/_components/JsonLd";
import { fundMeta, fundProductLd } from "@/lib/seo";

export const revalidate = 60;

const SIBLING_TICKERS = new Set(["CAUS", "CACE", "CADE", "CASV", "CAEM"]);

export async function generateStaticParams() {
  return Array.from(SIBLING_TICKERS).map((ticker) => ({ ticker }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();
  if (!SIBLING_TICKERS.has(ticker) || !SYMBOLS[ticker]) return {};
  return fundMeta(ticker);
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
  return (
    <>
      <JsonLd data={fundProductLd(ticker)} />
      <FundClient live={live} ticker={ticker} />
    </>
  );
}
