"use client";

import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, buildMockDataset } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";

const InsideCage = dynamic(
  () => import("./InsideCage").then((m) => m.InsideCage),
  { ssr: false }
);

export function InsideClient({ live }: { live: DashboardPayload | null }) {
  const dataset = live ? buildLiveDataset(live) : buildMockDataset();
  return (
    <DatasetProvider value={dataset}>
      <InsideCage />
    </DatasetProvider>
  );
}
