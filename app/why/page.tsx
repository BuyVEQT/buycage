import type { Metadata } from "next";
import { fetchDashboard } from "@/lib/data/fetchDashboard";
import { WhyClient } from "../_components/why/WhyClient";
import { JsonLd } from "../_components/JsonLd";
import { pageMeta, whyArticleLd, whyFaqLd } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMeta({
  title: "CAGE vs VEQT & XEQT: Why Tilt to Value & Profitability?",
  description:
    "VEQT and XEQT weight the world by size. CAGE (Avantis CIBC All-Equity ETF) tilts toward cheaper, more profitable companies. The evidence behind the tilt, what it costs, and who it's for.",
  path: "/why",
});

export default async function WhyPage() {
  const live = await fetchDashboard().catch(() => null);
  return (
    <>
      <JsonLd data={[whyArticleLd(), whyFaqLd()]} />
      <WhyClient live={live} />
    </>
  );
}
