"use client";

import { ANOMALIES, type Anomaly } from "./data";
import { ANOMALY_ICONS, IconInfo } from "./icons";

function AnomalyPill({ tag }: { tag: Anomaly }) {
  const Icon = ANOMALY_ICONS[tag.kind] || IconInfo;
  const tone = tag.tone === "neutral" ? "muted" : tag.tone;
  return (
    <span className="pill" data-tone={tone}>
      <Icon size={11} />
      <span>{tag.label}</span>
    </span>
  );
}

export function AnomalyRow() {
  if (!ANOMALIES.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {ANOMALIES.map((tag, i) => (
        <AnomalyPill key={tag.kind + i} tag={tag} />
      ))}
    </div>
  );
}
