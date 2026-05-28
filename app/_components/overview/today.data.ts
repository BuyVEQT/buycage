// Today-page editorial constants (labeled static data). Sleeve weights, day
// moves and contributions come from useDataset() (real Yahoo). The figures here
// are factsheet/illustrative ones Yahoo can't serve: per-sleeve descriptions and
// factor sub-loadings, the top-20 holdings table (per-stock day moves aren't in
// our 6-ETF feed), the four headline factor loadings, and the lookup fixtures.

export type SubFactor = { n: string; v: number; neg: boolean };

export type SleeveMeta = {
  shortName: string;
  region: string;
  holdings: string;
  note: string;
  dossierLine: string;
  factors: SubFactor[];
};

export const SLEEVE_META: Record<string, SleeveMeta> = {
  CAUS: {
    shortName: "US Equity",
    region: "US",
    holdings: "~3,800",
    note: "Apple · Microsoft · NVIDIA · Berkshire · JPMorgan · Exxon",
    dossierLine:
      "The <em>engine room</em>. ~3,800 US names, cap-weighted then nudged toward stocks that look <em>cheap</em> and <em>profitable</em>.",
    factors: [
      { n: "Value", v: 0.46, neg: false },
      { n: "Profitability", v: 0.41, neg: false },
      { n: "Size", v: 0.12, neg: false },
      { n: "Momentum", v: -0.05, neg: true },
    ],
  },
  CACE: {
    shortName: "Canadian Equity",
    region: "CA",
    holdings: "~250",
    note: "RBC · Shopify · TD · Brookfield · Enbridge · Canadian Natural",
    dossierLine:
      "The <em>home tilt</em>. ~250 Canadian names, slight overweight by mandate. Energy + financials carry the weight; Shopify gets trimmed for being unprofitable.",
    factors: [
      { n: "Value", v: 0.32, neg: false },
      { n: "Profitability", v: 0.28, neg: false },
      { n: "Size", v: 0.08, neg: false },
      { n: "Momentum", v: 0.02, neg: false },
    ],
  },
  CADE: {
    shortName: "International",
    region: "INTL",
    holdings: "~1,400",
    note: "Nestlé · Novo Nordisk · ASML · Toyota · LVMH · Roche",
    dossierLine:
      "The <em>developed-ex-NA</em> sleeve. Europe + Japan + Australia. Stable defensives like Nestlé sit near-neutral; ASML and Novo get an overweight on profitability.",
    factors: [
      { n: "Value", v: 0.38, neg: false },
      { n: "Profitability", v: 0.34, neg: false },
      { n: "Size", v: 0.1, neg: false },
      { n: "Momentum", v: -0.02, neg: true },
    ],
  },
  CASV: {
    shortName: "Global Small-Cap Value",
    region: "SC",
    holdings: "~2,800",
    note: "~2,800 small-caps · no single name above 0.4%",
    dossierLine:
      "The <em>dedicated tilt</em>. ~2,800 small-cap value names worldwide — no single position above 0.4%. <em>Highest factor load</em> of any sleeve in CAGE.",
    factors: [
      { n: "Value", v: 0.62, neg: false },
      { n: "Profitability", v: 0.45, neg: false },
      { n: "Size", v: 0.55, neg: false },
      { n: "Momentum", v: -0.08, neg: true },
    ],
  },
  CAEM: {
    shortName: "Emerging Markets",
    region: "EM",
    holdings: "~1,200",
    note: "TSMC · Tencent · Samsung · Alibaba · Reliance · HDFC",
    dossierLine:
      "The <em>EM kicker</em>. ~1,200 names across ~25 countries. Tilted to value; today's only laggard, dragged by China tech.",
    factors: [
      { n: "Value", v: 0.42, neg: false },
      { n: "Profitability", v: 0.3, neg: false },
      { n: "Size", v: 0.14, neg: false },
      { n: "Momentum", v: -0.12, neg: true },
    ],
  },
};

export type TodayHolding = {
  nm: string;
  tk: string;
  sleeve: string;
  wt: number;
  ch: number;
  role: string;
};

export const TODAY_HOLDINGS: TodayHolding[] = [
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
  { nm: "Toyota Motor", tk: "7203", sleeve: "CADE", wt: 0.46, ch: 0.3, role: "Value tilt · INTL" },
  { nm: "LVMH", tk: "MC", sleeve: "CADE", wt: 0.42, ch: 0.65, role: "Profitability tilt" },
  { nm: "TSMC", tk: "TSM", sleeve: "CAEM", wt: 0.42, ch: -0.25, role: "Overweight · EM value" },
  { nm: "Tencent", tk: "0700", sleeve: "CAEM", wt: 0.3, ch: -0.85, role: "EM value tilt" },
];

export type TodayFactor = { nm: string; sub: string; val: number; neg: boolean };

export const TODAY_FACTORS: TodayFactor[] = [
  { nm: "Value", sub: "Cheap on book & earnings", val: 0.42, neg: false },
  { nm: "Profitability", sub: "High cash profits / assets", val: 0.38, neg: false },
  { nm: "Size", sub: "Tilt toward smaller caps", val: 0.18, neg: false },
  { nm: "Momentum", sub: "Trailing 12-mo winners", val: -0.04, neg: true },
];

export type SearchFixture = {
  name: string;
  sleeve: string;
  weight: number;
  signal: string;
  reason: string;
};

export const SEARCH_FIXTURES: Record<string, SearchFixture> = {
  AAPL: { name: "Apple Inc.", sleeve: "CAUS", weight: 1.65, signal: "underweights AAPL by ~0.4 pp vs ACWI", reason: "profitability score elevated, valuation score low" },
  MSFT: { name: "Microsoft", sleeve: "CAUS", weight: 1.5, signal: "underweights MSFT by ~0.5 pp vs ACWI", reason: "premium valuation despite strong profitability" },
  NVDA: { name: "NVIDIA", sleeve: "CAUS", weight: 1.22, signal: "underweights NVDA by ~0.6 pp vs ACWI", reason: "exceptional growth, but rich on book multiples" },
  TD: { name: "Toronto-Dominion", sleeve: "CACE", weight: 1.85, signal: "overweights TD by ~0.2 pp vs ACWI", reason: "cheap on book, solid cash profits" },
  RY: { name: "Royal Bank", sleeve: "CACE", weight: 2.1, signal: "overweights RY by ~0.1 pp vs ACWI", reason: "Canadian home-tilt structural" },
  SHOP: { name: "Shopify", sleeve: "CACE", weight: 0.58, signal: "underweights SHOP by ~0.3 pp vs ACWI", reason: "unprofitable on operating basis, expensive on book" },
  TSM: { name: "TSMC", sleeve: "CAEM", weight: 0.42, signal: "overweights TSM by ~0.05 pp", reason: "high cash profitability, EM value sleeve" },
  NESN: { name: "Nestlé", sleeve: "CADE", weight: 0.78, signal: "is approximately neutral on NESN", reason: "stable defensives, market-cap-like in CADE" },
  BRK: { name: "Berkshire B", sleeve: "CAUS", weight: 0.95, signal: "overweights BRK by ~0.2 pp vs ACWI", reason: "value × profitability poster child" },
  META: { name: "Meta Platforms", sleeve: "CAUS", weight: 0.88, signal: "is approximately neutral on META", reason: "high profitability, fair on book" },
};
