"use client";

import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";
import Inside from "./Inside";

// Server-rendered (no ssr:false). Hazards removed: render-time clocks now derive
// from fetchedAt, trig-derived SVG coords are rounded, and the Sankey particle
// radius is deterministic — so the deep-dive copy is crawlable and hydrates clean.
export function InsideClient({ live }: { live: DashboardPayload | null }) {
  const dataset = buildLiveDataset(live ?? emptyPayload());
  return (
    <DatasetProvider value={dataset}>
      <Inside />
    </DatasetProvider>
  );
}
