import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { InsideClient } from "../_components/inside/InsideClient";

export const revalidate = 60;

export default async function InsidePage() {
  const live = await fetchDashboard().catch(() => null);
  return <InsideClient live={live} />;
}
