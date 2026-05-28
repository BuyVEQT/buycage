// Inside-page editorial constants (labeled static data). The rhythm heatmap,
// journey arc, sunburst weights, sleeve day moves and the performance lines all
// come from useDataset() (real Yahoo). These are the factsheet/illustrative
// figures Yahoo can't serve: the geographic Sankey allocation, the top-40
// holdings table (per-stock day moves), and sleeve short labels.

export const SLEEVE_SHORT: Record<string, { name: string; region: string }> = {
  CAUS: { name: "US Equity", region: "US" },
  CACE: { name: "Canadian Equity", region: "CA" },
  CADE: { name: "International", region: "INTL" },
  CASV: { name: "Global Small-Cap Value", region: "SC" },
  CAEM: { name: "Emerging Markets", region: "EM" },
};

export type InsideHolding = {
  nm: string;
  tk: string;
  sleeve: string;
  wt: number;
  ch: number;
  role: string;
};

export const INSIDE_HOLDINGS: InsideHolding[] = [
  { nm: "Apple Inc.", tk: "AAPL", sleeve: "CAUS", wt: 1.65, ch: 1.85, role: "Underweight vs ACWI" },
  { nm: "Microsoft", tk: "MSFT", sleeve: "CAUS", wt: 1.5, ch: 1.42, role: "Underweight vs ACWI" },
  { nm: "NVIDIA", tk: "NVDA", sleeve: "CAUS", wt: 1.22, ch: 2.1, role: "Underweight vs ACWI" },
  { nm: "Royal Bank of Canada", tk: "RY", sleeve: "CACE", wt: 2.1, ch: 1.2, role: "Canadian home tilt" },
  { nm: "Toronto-Dominion", tk: "TD", sleeve: "CACE", wt: 1.85, ch: 1.05, role: "Overweight · cheap on book" },
  { nm: "Enbridge", tk: "ENB", sleeve: "CACE", wt: 1.1, ch: 0.95, role: "Cash-profitable · overweight" },
  { nm: "Canadian Natural Res.", tk: "CNQ", sleeve: "CACE", wt: 0.98, ch: 0.75, role: "Value × profitability" },
  { nm: "Berkshire Hathaway B", tk: "BRK.B", sleeve: "CAUS", wt: 0.95, ch: 0.78, role: "Overweight · deep value" },
  { nm: "JPMorgan Chase", tk: "JPM", sleeve: "CAUS", wt: 0.92, ch: 1.3, role: "Overweight · financials value" },
  { nm: "Meta Platforms", tk: "META", sleeve: "CAUS", wt: 0.88, ch: 2.05, role: "Near-neutral vs ACWI" },
  { nm: "Brookfield Corp.", tk: "BN", sleeve: "CACE", wt: 0.88, ch: 1.55, role: "Overweight · alt assets" },
  { nm: "ExxonMobil", tk: "XOM", sleeve: "CAUS", wt: 0.86, ch: 0.2, role: "Energy · high profitability" },
  { nm: "Nestlé", tk: "NESN", sleeve: "CADE", wt: 0.78, ch: 0.42, role: "Intl defensive · neutral" },
  { nm: "Novo Nordisk", tk: "NOVO.B", sleeve: "CADE", wt: 0.62, ch: 0.85, role: "Profitability tilt" },
  { nm: "Shopify", tk: "SHOP", sleeve: "CACE", wt: 0.58, ch: 2.5, role: "Underweight · unprofitable" },
  { nm: "ASML Holding", tk: "ASML", sleeve: "CADE", wt: 0.54, ch: 0.95, role: "Profitability tilt" },
  { nm: "Bank of Montreal", tk: "BMO", sleeve: "CACE", wt: 0.52, ch: 0.92, role: "Canadian financials" },
  { nm: "Bank of Nova Scotia", tk: "BNS", sleeve: "CACE", wt: 0.48, ch: 0.68, role: "Canadian financials" },
  { nm: "Toyota Motor", tk: "7203", sleeve: "CADE", wt: 0.46, ch: 0.3, role: "Value tilt · INTL" },
  { nm: "TSMC", tk: "TSM", sleeve: "CAEM", wt: 0.42, ch: -0.25, role: "Overweight · EM value" },
  { nm: "LVMH", tk: "MC", sleeve: "CADE", wt: 0.42, ch: 0.65, role: "Profitability tilt" },
  { nm: "Roche", tk: "ROG", sleeve: "CADE", wt: 0.4, ch: 0.18, role: "Defensive · neutral" },
  { nm: "AstraZeneca", tk: "AZN", sleeve: "CADE", wt: 0.38, ch: 0.42, role: "Defensive · neutral" },
  { nm: "SAP", tk: "SAP", sleeve: "CADE", wt: 0.36, ch: 0.55, role: "Profitability tilt" },
  { nm: "Suncor Energy", tk: "SU", sleeve: "CACE", wt: 0.34, ch: 0.85, role: "Value tilt" },
  { nm: "Tencent", tk: "0700", sleeve: "CAEM", wt: 0.3, ch: -0.85, role: "EM value tilt" },
  { nm: "Samsung Electronics", tk: "005930", sleeve: "CAEM", wt: 0.29, ch: -0.32, role: "EM value tilt" },
  { nm: "Constellation Software", tk: "CSU", sleeve: "CACE", wt: 0.28, ch: 1.85, role: "Quality + growth" },
  { nm: "Manulife Financial", tk: "MFC", sleeve: "CACE", wt: 0.26, ch: 0.55, role: "Insurance value" },
  { nm: "BHP Group", tk: "BHP", sleeve: "CADE", wt: 0.24, ch: 0.42, role: "Materials · value" },
  { nm: "Alibaba", tk: "BABA", sleeve: "CAEM", wt: 0.22, ch: -0.95, role: "EM value tilt" },
  { nm: "Sun Life Financial", tk: "SLF", sleeve: "CACE", wt: 0.21, ch: 0.45, role: "Insurance value" },
  { nm: "Hitachi", tk: "6501", sleeve: "CADE", wt: 0.19, ch: 0.62, role: "Japan value" },
  { nm: "HDFC Bank", tk: "HDFCBANK", sleeve: "CAEM", wt: 0.18, ch: 0.32, role: "EM quality" },
  { nm: "Reliance Industries", tk: "RELIANCE", sleeve: "CAEM", wt: 0.17, ch: 0.28, role: "EM conglomerate" },
  { nm: "Mitsubishi UFJ", tk: "8306", sleeve: "CADE", wt: 0.17, ch: 0.78, role: "Japan banks · value" },
  { nm: "Pembina Pipeline", tk: "PPL", sleeve: "CACE", wt: 0.16, ch: 0.32, role: "Pipeline yield" },
  { nm: "Diageo", tk: "DGE", sleeve: "CADE", wt: 0.15, ch: 0.18, role: "Defensive" },
  { nm: "Vale", tk: "VALE", sleeve: "CAEM", wt: 0.14, ch: -0.22, role: "EM materials" },
  { nm: "Loblaw", tk: "L", sleeve: "CACE", wt: 0.13, ch: 0.42, role: "Defensive Canadian" },
];

// ─── Sankey: $100 → 5 sleeves → 6 regions (geographic factsheet allocation) ───
export type SankeyRegion = { id: string; name: string; pct: number };
export const SANKEY_REGIONS: SankeyRegion[] = [
  { id: "US", name: "United States", pct: 42.9 },
  { id: "CA", name: "Canada", pct: 30.0 },
  { id: "EU", name: "Europe", pct: 13.5 },
  { id: "JP", name: "Japan", pct: 6.0 },
  { id: "ASIA", name: "Asia ex-EM", pct: 1.6 },
  { id: "EM", name: "Emerging mkts", pct: 6.0 },
];

export type SankeyFlow = { from: string; to: string; v: number };
export const SANKEY_FLOWS: SankeyFlow[] = [
  { from: "CAUS", to: "US", v: 39.4 },
  { from: "CACE", to: "CA", v: 30.0 },
  { from: "CADE", to: "EU", v: 11.0 },
  { from: "CADE", to: "JP", v: 5.0 },
  { from: "CADE", to: "ASIA", v: 1.6 },
  { from: "CASV", to: "US", v: 3.5 },
  { from: "CASV", to: "EU", v: 2.5 },
  { from: "CASV", to: "JP", v: 1.0 },
  { from: "CASV", to: "EM", v: 1.0 },
  { from: "CAEM", to: "EM", v: 5.0 },
];
