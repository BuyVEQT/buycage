import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { WhyClient } from "../_components/why/WhyClient";

export const revalidate = 60;

export default async function WhyPage() {
  const live = await fetchDashboard().catch(() => null);
  return <WhyClient live={live} />;
}
