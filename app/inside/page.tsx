import type { Metadata } from "next";
import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { InsideClient } from "../_components/inside/InsideClient";
import { pageMeta } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMeta({
  title: "Inside CAGE: Holdings, Regions & Money Flow",
  description:
    "Look inside CAGE.TO: its five Avantis CIBC sibling ETFs, regional weights, a holdings X-ray, a money-flow map, and the 12-week return rhythm.",
  path: "/inside",
});

export default async function InsidePage() {
  const live = await fetchDashboard().catch(() => null);
  return <InsideClient live={live} />;
}
