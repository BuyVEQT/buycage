"use client";

import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";
import { Fund } from "./Fund";

// Server-rendered. Fund's only un-SSR-able piece (the recharts chart) is itself
// a client-only dynamic island inside Fund, so the per-ticker name, price, and
// holdings table render into the initial HTML for crawlers.
export function FundClient({
  live,
  ticker,
}: {
  live: DashboardPayload | null;
  ticker: string;
}) {
  const dataset = buildLiveDataset(live ?? emptyPayload());
  return (
    <DatasetProvider value={dataset}>
      <Fund ticker={ticker} />
    </DatasetProvider>
  );
}
