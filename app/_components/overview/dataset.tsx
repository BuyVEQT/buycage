"use client";

import { createContext, useContext, type ReactNode } from "react";
import { buildLiveDataset, emptyPayload, type Dataset } from "./data";

// Fallback for any consumer that renders outside a provider. Empty dataset
// (no bars, zero prices) — components render their own empty states rather
// than mock data.
const FALLBACK_DATASET: Dataset = buildLiveDataset(emptyPayload());

const DatasetContext = createContext<Dataset>(FALLBACK_DATASET);

export function DatasetProvider({
  value,
  children,
}: {
  value: Dataset;
  children: ReactNode;
}) {
  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  );
}

export function useDataset(): Dataset {
  return useContext(DatasetContext);
}
