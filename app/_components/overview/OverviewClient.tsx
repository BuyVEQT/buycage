"use client";

import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "./data";
import { DatasetProvider } from "./dataset";

const Today = dynamic(() => import("./Today"), { ssr: false });

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
