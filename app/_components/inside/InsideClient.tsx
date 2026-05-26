"use client";

import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";

const InsideCage = dynamic(
  () => import("./InsideCage").then((m) => m.InsideCage),
  { ssr: false }
);

export function InsideClient({ live }: { live: DashboardPayload | null }) {
  const dataset = buildLiveDataset(live ?? emptyPayload());
  return (
    <DatasetProvider value={dataset}>
      <InsideCage />
    </DatasetProvider>
  );
}
