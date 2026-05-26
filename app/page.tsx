import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { OverviewClient } from "./_components/overview/OverviewClient";

// Refetch from Yahoo at most once per minute. The lib's own 24h disk cache
// underneath this means real Yahoo round-trips are even rarer.
export const revalidate = 60;

export default async function HomePage() {
  // Never blow up the page if Yahoo or the cache layer fails — OverviewClient
  // falls back to the mock dataset when live is null.
  const live = await fetchDashboard().catch(() => null);
  return <OverviewClient live={live} />;
}
