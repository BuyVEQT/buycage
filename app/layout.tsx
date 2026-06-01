import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "./_components/JsonLd";
import { SITE_NAME, SITE_URL, organizationLd, websiteLd } from "@/lib/seo";
import "./globals.css";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: "400",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  // Canonical host is www — the only host wired in Vercel. The apex doesn't
  // resolve, so an apex metadataBase made every canonical + og:image point at
  // a dead domain (broken link-preview cards everywhere).
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JustBuyCage — Live CAGE ETF (CAGE.TO) Dashboard",
    template: "%s · JustBuyCage",
  },
  description:
    "A daily, independent read on CAGE — the Avantis CIBC All-Equity ETF (CAGE.TO) that tilts toward cheaper, more profitable companies.",
  applicationName: SITE_NAME,
  keywords: [
    "CAGE ETF",
    "CAGE.TO",
    "Avantis CIBC All-Equity ETF",
    "CAGE vs VEQT",
    "CAGE vs XEQT",
    "factor investing Canada",
    "value ETF Canada",
    "all-equity ETF",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "JustBuyCage — Live CAGE ETF (CAGE.TO) Dashboard",
    description:
      "The Canadian all-equity ETF that tilts on purpose — toward cheaper, more profitable companies. Live price, holdings, and the case for the tilt.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JustBuyCage — Live CAGE ETF (CAGE.TO) Dashboard",
    description:
      "The Canadian all-equity ETF that tilts on purpose — toward cheaper, more profitable companies.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${archivoBlack.variable} ${inter.variable} ${instrumentSerif.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
