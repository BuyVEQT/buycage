// Centralized SEO constants, per-page metadata helper, and JSON-LD (schema.org)
// builders.
//
// Canonical host is the **www** subdomain — that's the only host wired in
// Vercel. The apex (buycage.ca) does not resolve in DNS, so every absolute URL
// here must use www, or canonical tags + link-preview images point at a dead
// host. If the apex is ever added in Vercel with a 301 to www, this stays the
// canonical and nothing here needs to change.

import type { Metadata } from "next";
import { SYMBOLS } from "@/lib/data/symbols";

export const SITE_URL = "https://www.buycage.ca";
export const SITE_NAME = "JustBuyCage";

/** Absolute URL for a path, resolved against the canonical www host. */
export const abs = (path = "/") => new URL(path, SITE_URL).toString();

const OG_IMAGE = abs("/opengraph-image.png");
const LOGO = abs("/icon.svg");

// Factsheet-true CAGE facts reused across metadata + structured data.
const CAGE = {
  ticker: "CAGE",
  yahoo: "CAGE.TO",
  name: "Avantis CIBC All-Equity Asset Allocation ETF",
  mer: "0.28%",
};

// Sibling target weights + one-line role from the CAGE factsheet (April 2026).
// Static factsheet figures, allowed under the project's data-scoping policy.
const SIBLING_SEO: Record<string, { weight: string; blurb: string }> = {
  CAUS: { weight: "39.4%", blurb: "U.S. all-cap equity with a value + profitability tilt" },
  CACE: { weight: "30.0%", blurb: "Canadian equity with a value + profitability tilt" },
  CADE: { weight: "17.6%", blurb: "developed-international equity with a value + profitability tilt" },
  CASV: { weight: "8.0%", blurb: "global small-cap value equity" },
  CAEM: { weight: "5.0%", blurb: "emerging-markets equity with a value + profitability tilt" },
};

// ─── Per-page metadata helper ────────────────────────────────────────────────
// Re-specifies the full openGraph/twitter block per page. Next merges metadata
// shallowly — a child that sets `openGraph` replaces the parent's entirely — so
// we must restate type, siteName, AND the share image, or child routes inherit
// none of them. (The file-convention app/opengraph-image.png only attaches to
// the root segment; without this, /why, /inside, /fund/* shipped with no
// preview card at all.) `path` is relative; Next resolves it + the image URLs
// against metadataBase, giving canonical, og:url, and og:image on the www host.
const OG_IMAGE_CARD = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "JustBuyCage — the CAGE ETF (CAGE.TO) dashboard",
};

export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [OG_IMAGE_CARD],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image.png"],
    },
  };
}

/** Per-sibling metadata for /fund/[ticker], front-loading the ticker. */
export function fundMeta(ticker: string): Metadata {
  const name = SYMBOLS[ticker]?.fullName ?? ticker;
  const meta = SIBLING_SEO[ticker];
  const description = meta
    ? `${name} (${ticker}.TO) provides ${meta.blurb} — a ${meta.weight} target holding inside CAGE, the Avantis CIBC All-Equity ETF. Live price and its role in the portfolio.`
    : `${name} (${ticker}.TO) — a sibling fund held inside CAGE, the Avantis CIBC All-Equity ETF. Live price and its role in the portfolio.`;
  return pageMeta({ title: `${ticker}.TO — ${name}`, description, path: `/fund/${ticker}` });
}

// ─── JSON-LD builders ────────────────────────────────────────────────────────

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO,
  description:
    "Independent live dashboard and explainer for CAGE — the Avantis CIBC All-Equity ETF.",
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
});

export const cageProductLd = () => ({
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  name: `${CAGE.name} (${CAGE.ticker})`,
  alternateName: CAGE.yahoo,
  identifier: CAGE.yahoo,
  url: SITE_URL,
  category: "All-equity asset allocation ETF",
  provider: { "@type": "Organization", name: "CIBC Asset Management" },
  feesAndCommissionsSpecification: `Management expense ratio (MER): ${CAGE.mer}.`,
  description:
    "CAGE is a one-ticker, globally diversified all-equity ETF sub-advised by Avantis Investors. It holds roughly 9,000 companies through five sibling ETFs and tilts toward cheaper, more profitable companies (the value and profitability factors). MER 0.28%; listed in Canada on Cboe Canada / TSX, inception 18 March 2026.",
});

export const fundProductLd = (ticker: string) => {
  const name = SYMBOLS[ticker]?.fullName ?? ticker;
  const meta = SIBLING_SEO[ticker];
  return {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${name} (${ticker})`,
    alternateName: `${ticker}.TO`,
    identifier: `${ticker}.TO`,
    url: abs(`/fund/${ticker}`),
    category: "Exchange-traded fund (ETF)",
    provider: { "@type": "Organization", name: "CIBC Asset Management" },
    isRelatedTo: {
      "@type": "FinancialProduct",
      name: CAGE.name,
      alternateName: CAGE.yahoo,
      url: SITE_URL,
    },
    description: meta
      ? `${name} (${ticker}.TO) provides ${meta.blurb}. It is a ${meta.weight} target holding inside CAGE, the Avantis CIBC All-Equity ETF.`
      : `${name} (${ticker}.TO) — a sibling fund held inside CAGE, the Avantis CIBC All-Equity ETF.`,
  };
};

export const whyArticleLd = () => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Why CAGE, not VEQT? The case for a value + profitability tilt",
  description:
    "VEQT and XEQT weight the world by size. CAGE tilts toward cheaper, more profitable companies. The evidence behind the tilt, what it costs, and who it's for.",
  image: OG_IMAGE,
  author: { "@type": "Organization", name: "The BuyCage Desk" },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: { "@type": "ImageObject", url: LOGO },
  },
  mainEntityOfPage: abs("/why"),
  isAccessibleForFree: true,
  about: ["CAGE ETF", "Factor investing", "Value premium", "Profitability premium", "Avantis"],
});

export const whyFaqLd = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is CAGE (CAGE.TO)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CAGE is the Avantis CIBC All-Equity Asset Allocation ETF — a one-ticker, globally diversified all-equity fund holding roughly 9,000 companies through five sibling Avantis CIBC ETFs. Unlike VEQT or XEQT, it tilts toward cheaper, more profitable companies (the value and profitability factors).",
      },
    },
    {
      "@type": "Question",
      name: "How is CAGE different from VEQT and XEQT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VEQT and XEQT weight companies by market capitalization — the bigger a company already is, the more you own. CAGE weights by evidence, systematically tilting toward stocks that are cheaper relative to their fundamentals and more profitable. Same global, all-equity structure; opposite weighting philosophy.",
      },
    },
    {
      "@type": "Question",
      name: "What does CAGE cost compared with VEQT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CAGE's management expense ratio (MER) is 0.28%, about 4 basis points more than VEQT's 0.24% — roughly $4 a year more on a $10,000 investment. You pay for active daily screening on price and profitability rather than pure index replication.",
      },
    },
    {
      "@type": "Question",
      name: "Who is CAGE for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CAGE suits long-term investors with a 10-year-plus horizon who believe in decades of factor evidence and won't panic-sell when the tilt lags the index — which it can, for years. If you'll compare your return to a friend's index fund every quarter, a plain cap-weighted fund like VEQT or XEQT may fit better.",
      },
    },
  ],
});
