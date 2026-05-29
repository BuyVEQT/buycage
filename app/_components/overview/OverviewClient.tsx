"use client";

import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "./data";
import { DatasetProvider } from "./dataset";
import Today from "./Today";

// Server-rendered (no ssr:false). The dataset is now a pure function of the
// server payload (buildLiveDataset derives "today" from fetchedAt), so the
// home page hydrates without mismatch and crawlers get the hero copy, the
// thesis, the factor pitch, and the teaser text in the initial HTML.
export function OverviewClient({ live }: { live: DashboardPayload | null }) {
  // Always go through buildLiveDataset — no synthesised mock fallback.
  // If the server-side fetch returned null (Yahoo down + cache miss),
  // emptyPayload() yields a dataset full of zeroes / empty arrays and the
  // UI renders its own empty states.
  const dataset = buildLiveDataset(live ?? emptyPayload());
  return (
    <DatasetProvider value={dataset}>
      <Today />
    </DatasetProvider>
  );
}
