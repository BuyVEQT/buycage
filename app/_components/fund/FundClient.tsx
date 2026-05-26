"use client";

import dynamic from "next/dynamic";
import type { DashboardPayload } from "@/lib/data/fetchDashboard";
import { buildLiveDataset, emptyPayload } from "../overview/data";
import { DatasetProvider } from "../overview/dataset";

const Fund = dynamic(() => import("./Fund").then((m) => m.Fund), {
  ssr: false,
});

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
