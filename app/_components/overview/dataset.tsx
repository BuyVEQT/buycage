"use client";

import { createContext, useContext, type ReactNode } from "react";
import { buildMockDataset, type Dataset } from "./data";

// Eager fallback so a forgotten provider still renders something rather
// than throwing at runtime in dev.
const FALLBACK_DATASET = buildMockDataset();

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
