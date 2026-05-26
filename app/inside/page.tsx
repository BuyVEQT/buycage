"use client";

import dynamic from "next/dynamic";

const InsideCage = dynamic(
  () => import("../_components/inside/InsideCage").then((m) => m.InsideCage),
  { ssr: false }
);

export default function InsidePage() {
  return <InsideCage />;
}
