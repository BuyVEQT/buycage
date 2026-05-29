"use client";

import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";
import Why from "./Why";

// Server-rendered (no ssr:false): the /why article is the prime SEO asset and
// has no hydration hazards — every window/scroll access is inside useEffect and
// the SVG visuals are deterministic (no Math.random, no recharts). Crawlers now
// get the full article text in the initial HTML instead of an empty shell.
export function WhyClient({ live }: { live: DashboardPayload | null }) {
  const dataset = buildLiveDataset(live ?? emptyPayload());
  return (
    <DatasetProvider value={dataset}>
      <Why />
    </DatasetProvider>
  );
}
