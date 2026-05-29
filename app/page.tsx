import type { Metadata } from "next";
import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { OverviewClient } from "./_components/overview/OverviewClient";
import { JsonLd } from "./_components/JsonLd";
import { cageProductLd, pageMeta } from "@/lib/seo";

// Refetch from Yahoo at most once per minute. The lib's own 24h disk cache
// underneath this means real Yahoo round-trips are even rarer.
export const revalidate = 60;

export const metadata: Metadata = pageMeta({
  title: "CAGE ETF (CAGE.TO): Live Price, Holdings & Factor Tilt",
  description:
    "Live, independent dashboard for CAGE — the Avantis CIBC All-Equity ETF (CAGE.TO). Daily price, holdings, its five sibling funds, and the value + profitability tilt, explained.",
  path: "/",
});

export default async function HomePage() {
  // Never blow up the page if Yahoo or the cache layer fails — OverviewClient
  // falls back to the mock dataset when live is null.
  const live = await fetchDashboard().catch(() => null);
  return (
    <>
      <JsonLd data={cageProductLd()} />
      <OverviewClient live={live} />
    </>
  );
}
