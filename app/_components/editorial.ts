// Labeled static editorial data the Tabloid Punk design needs but Yahoo can't
// serve — factor loadings, the bubble universe, the $1 factor-growth race, and
// the head-to-head table. These are illustrative / factsheet-derived figures.
//
// Per the project data policy, the "real Yahoo data only" rule is scoped to
// price/return TIME-SERIES (those stay live via useDataset). Factsheet/academic
// figures like these are allowed as clearly-labeled static data.

export type Region = "US" | "CA" | "INTL" | "EM";

export const REGION_COLOR: Record<Region, string> = {
  US: "#e8281f",
  CA: "#f0c12a",
  INTL: "#e8e3d3",
  EM: "#9b3a1c",
};

// ─── Bubble universe (Why scrollytelling: market-cap → CAGE-tilt morph) ───────
// cap  = market-cap weight (what VEQT does); mega-caps balloon.
// tilt = CAGE effective weight; value/profitable names grow, mega-caps shrink.
export type BubbleCompany = {
  nm: string;
  tk: string;
  region: Region;
  cap: number;
  tilt: number;
};

export const BUBBLE_COMPANIES: BubbleCompany[] = [
  { nm: "Apple", tk: "AAPL", region: "US", cap: 5.6, tilt: 1.7 },
  { nm: "Microsoft", tk: "MSFT", region: "US", cap: 5.1, tilt: 1.6 },
  { nm: "Nvidia", tk: "NVDA", region: "US", cap: 5.0, tilt: 1.2 },
  { nm: "Amazon", tk: "AMZN", region: "US", cap: 3.4, tilt: 0.9 },
  { nm: "Alphabet", tk: "GOOGL", region: "US", cap: 2.8, tilt: 1.0 },
  { nm: "Meta", tk: "META", region: "US", cap: 2.2, tilt: 0.9 },
  { nm: "Broadcom", tk: "AVGO", region: "US", cap: 1.6, tilt: 0.6 },
  { nm: "Tesla", tk: "TSLA", region: "US", cap: 1.5, tilt: 0.3 },
  { nm: "Lilly", tk: "LLY", region: "US", cap: 1.3, tilt: 0.7 },
  { nm: "JPMorgan", tk: "JPM", region: "US", cap: 1.1, tilt: 1.4 },
  { nm: "Berkshire", tk: "BRK", region: "US", cap: 1.0, tilt: 1.5 },
  { nm: "Exxon", tk: "XOM", region: "US", cap: 0.9, tilt: 1.6 },
  { nm: "UnitedHealth", tk: "UNH", region: "US", cap: 0.8, tilt: 1.1 },
  { nm: "Chevron", tk: "CVX", region: "US", cap: 0.7, tilt: 1.2 },
  { nm: "Cisco", tk: "CSCO", region: "US", cap: 0.6, tilt: 0.9 },
  { nm: "Pfizer", tk: "PFE", region: "US", cap: 0.5, tilt: 0.9 },
  { nm: "RBC", tk: "RY", region: "CA", cap: 0.7, tilt: 2.1 },
  { nm: "TD", tk: "TD", region: "CA", cap: 0.6, tilt: 1.9 },
  { nm: "Enbridge", tk: "ENB", region: "CA", cap: 0.4, tilt: 1.3 },
  { nm: "CNQ", tk: "CNQ", region: "CA", cap: 0.4, tilt: 1.2 },
  { nm: "Brookfield", tk: "BN", region: "CA", cap: 0.4, tilt: 1.1 },
  { nm: "Suncor", tk: "SU", region: "CA", cap: 0.3, tilt: 0.9 },
  { nm: "Shopify", tk: "SHOP", region: "CA", cap: 0.5, tilt: 0.4 },
  { nm: "Nestlé", tk: "NESN", region: "INTL", cap: 0.7, tilt: 1.0 },
  { nm: "Novo", tk: "NOVO", region: "INTL", cap: 0.7, tilt: 1.0 },
  { nm: "ASML", tk: "ASML", region: "INTL", cap: 0.6, tilt: 0.8 },
  { nm: "Toyota", tk: "7203", region: "INTL", cap: 0.5, tilt: 1.2 },
  { nm: "Roche", tk: "ROG", region: "INTL", cap: 0.5, tilt: 0.9 },
  { nm: "Shell", tk: "SHEL", region: "INTL", cap: 0.4, tilt: 1.1 },
  { nm: "LVMH", tk: "MC", region: "INTL", cap: 0.5, tilt: 0.8 },
  { nm: "SAP", tk: "SAP", region: "INTL", cap: 0.4, tilt: 0.8 },
  { nm: "TSMC", tk: "TSM", region: "EM", cap: 0.9, tilt: 1.3 },
  { nm: "Tencent", tk: "0700", region: "EM", cap: 0.6, tilt: 0.8 },
  { nm: "Samsung", tk: "005930", region: "EM", cap: 0.5, tilt: 0.9 },
  { nm: "Alibaba", tk: "BABA", region: "EM", cap: 0.4, tilt: 0.7 },
  { nm: "Reliance", tk: "RELI", region: "EM", cap: 0.3, tilt: 0.6 },
];

// ─── $1 factor-growth race (Why step 04) — illustrative long-run premia ───────
export type RaceSeries = { key: string; nm: string; cagr: number; color: string };

export const RACE_SERIES: RaceSeries[] = [
  { key: "mkt", nm: "Market", cagr: 0.105, color: "#7a7568" },
  { key: "prof", nm: "Profitability", cagr: 0.118, color: "#e8e3d3" },
  { key: "val", nm: "Value", cagr: 0.124, color: "#f0c12a" },
  { key: "scv", nm: "Small-cap value", cagr: 0.135, color: "#e8281f" },
];

// ─── CAGE's four factor dials (Why step 05) — loadings vs ACWI IMI = 0 ────────
export type FactorDial = {
  nm: string;
  em: string;
  load: number;
  sub: string;
  desc: string; // contains trusted inline <strong> markup
};

export const FACTOR_DIALS: FactorDial[] = [
  {
    nm: "Value",
    em: "cheap",
    load: 0.42,
    sub: "Book-to-price tilt",
    desc: "CAGE owns more of companies trading <strong>cheaply relative to their book value</strong>. The value premium — cheap beats expensive — shows up in U.S. data back to <strong>1926</strong> and across dozens of countries. It is the oldest, most-replicated edge in markets.",
  },
  {
    nm: "Profitability",
    em: "quality",
    load: 0.38,
    sub: "Cash profits ÷ book equity",
    desc: "Tilts toward companies earning <strong>more cash per dollar of equity</strong>. Of all the Fama–French factors, profitability (RMW) has been the <strong>most consistent across eras</strong> — profitable businesses simply compound better.",
  },
  {
    nm: "Size",
    em: "smaller",
    load: 0.18,
    sub: "Below the mega-cap index",
    desc: "Leans slightly <strong>smaller</strong> than a market that is now dangerously top-heavy in a few US giants. Smaller companies have historically out-returned large ones — with more volatility as the toll.",
  },
  {
    nm: "Investment",
    em: "disciplined",
    load: 0.15,
    sub: "Conservative ÷ aggressive",
    desc: "Favours companies that grow <strong>disciplined</strong>, not ones that dilute shareholders chasing every shiny expansion. Conservative investors have quietly beaten the empire-builders.",
  },
];

// ─── Head-to-head table (Why step 06) ─────────────────────────────────────────
// cell = [display value, isEdge]
export type H2HCell = [string, boolean];
export type H2HRow = { k: string; cage: H2HCell; veqt: H2HCell; xeqt: H2HCell };

export const H2H_COLS = ["CAGE", "VEQT", "XEQT"] as const;
export const H2H_NAMES: Record<string, string> = {
  CAGE: "Avantis CIBC",
  VEQT: "Vanguard",
  XEQT: "iShares",
};

export const H2H_ROWS: H2HRow[] = [
  { k: "Weighting", cage: ["Value × profitability tilt", true], veqt: ["Pure market cap", false], xeqt: ["Pure market cap", false] },
  { k: "Top-10 concentration", cage: ["~11%", true], veqt: ["~25%", false], xeqt: ["~24%", false] },
  { k: "Holdings", cage: ["~9,000", false], veqt: ["~13,500", false], xeqt: ["~9,800", false] },
  { k: "Factor tilt", cage: ["Value, profit, size", true], veqt: ["None (the market)", false], xeqt: ["None (the market)", false] },
  { k: "Implementation", cage: ["Active, rules-based", false], veqt: ["Passive index", false], xeqt: ["Passive index", false] },
  { k: "MER", cage: ["0.28%", false], veqt: ["0.24%", true], xeqt: ["0.20%", true] },
  { k: "Rebalancing", cage: ["Daily screen", true], veqt: ["Quarterly", false], xeqt: ["Semi-annual", false] },
  { k: "Best for", cage: ["Patient tilt believers", false], veqt: ["Set-and-forget indexers", false], xeqt: ["Lowest-cost indexers", false] },
];
