"use client";

import dynamic from "next/dynamic";

// Overview is fully client-driven (animated SVG, scroll-driven UI, localStorage,
// Recharts ResponsiveContainer that needs real DOM dimensions). Skip SSR so we
// don't pay for a render that the client immediately discards — and avoid the
// Recharts "width(-1)" warning at prerender time.
const Overview = dynamic(
  () => import("./_components/overview/Overview").then((m) => m.Overview),
  { ssr: false }
);

export default function Home() {
  return <Overview />;
}
