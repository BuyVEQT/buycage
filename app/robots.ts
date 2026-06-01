import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Served at /robots.txt. Crawlers welcome everywhere except the JSON API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
