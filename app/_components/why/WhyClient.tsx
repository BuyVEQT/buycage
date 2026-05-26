"use client";

import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";

const Why = dynamic(() => import("./Why").then((m) => m.Why), { ssr: false });

export function WhyClient({ live }: { live: DashboardPayload | null }) {
  const dataset = buildLiveDataset(live ?? emptyPayload());
  return (
    <DatasetProvider value={dataset}>
      <Why />
    </DatasetProvider>
  );
}
