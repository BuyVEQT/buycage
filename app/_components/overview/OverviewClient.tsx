"use client";

import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, buildMockDataset } from "./data";
import { DatasetProvider } from "./dataset";

// Overview is loaded client-only so Recharts ResponsiveContainer has real DOM
// dimensions. Server fetches the data; this wrapper transforms it into the
// Dataset shape and threads it through context.
const Overview = dynamic(
  () => import("./Overview").then((m) => m.Overview),
  { ssr: false }
);

export function OverviewClient({ live }: { live: DashboardPayload | null }) {
  const dataset = live ? buildLiveDataset(live) : buildMockDataset();
  return (
    <DatasetProvider value={dataset}>
      <Overview />
    </DatasetProvider>
  );
}
