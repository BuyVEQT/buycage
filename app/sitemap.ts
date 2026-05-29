import type { MetadataRoute } from "next";
import { SIBLING_SYMBOLS } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

// Served at /sitemap.xml. All URLs use the canonical www host.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/why`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/inside`, lastModified, changeFrequency: "daily", priority: 0.8 },
    ...SIBLING_SYMBOLS.map((ticker) => ({
      url: `${SITE_URL}/fund/${ticker}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
