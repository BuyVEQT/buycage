import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  metadataBase: new URL("https://buycage.ca"),
  title: {
    default: "JustBuyCage — Trust the math, not the crowd",
    template: "%s · JustBuyCage",
  },
  description:
    "A daily, opinionated read on CAGE — the Canadian all-equity ETF that tilts toward cheaper, more profitable companies.",
  openGraph: {
    type: "website",
    siteName: "JustBuyCage",
    url: "https://buycage.ca",
    title: "JustBuyCage — Trust the math, not the crowd",
    description:
      "The only Canadian-listed all-equity ETF that tilts on purpose — toward cheaper, more profitable companies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JustBuyCage — Trust the math, not the crowd",
    description:
      "The only Canadian-listed all-equity ETF that tilts on purpose — toward cheaper, more profitable companies.",
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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
