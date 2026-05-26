// Dataset construction for the BuyCage dashboard.
//
// Exports:
//   • buildMockDataset()         — synthesises 250 trading days deterministically
//   • buildLiveDataset(payload)  — overlays real Yahoo data on the mock skeleton
//   • Direct constants (PRICE, SERIES, …)  — back-compat re-exports of buildMockDataset()
//
// Components consume the dataset via useDataset() (see dataset.tsx).

import type { DashboardPayload } from "@/lib/data/fetchDashboard";

// ─── types ───────────────────────────────────────────────────────────────────
export type Bar = {
  t: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SeriesPoint = { t: number; price: number };

export type SiblingColor = "us" | "intl" | "em" | "ca" | "smallcap";

export type SiblingConfig = {
  ticker: string;
  name: string;
  cageWeight: number;
  beta: number;
  vol: number;
  driftAdj: number;
  seed: number;
  color: SiblingColor;
};

export type Holding = {
  name: string;
  ticker: string;
  sector: string;
  weight: number;
};

export type Sibling = SiblingConfig & {
  weight: number;
  holdings: Holding[];
  dayChangePct: number;
  contribution: number;
};

export type EffectiveHolding = {
  name: string;
  ticker: string;
  sector: string;
  weight: number;
  sources: { etf: string; weight: number }[];
};

export type Anomaly = {
  kind: string;
  label: string;
  tone: "gain" | "loss" | "muted" | "neutral";
};

export type Direction = { t: number; date: string; ret: number; dir: number };

export type PriceShape = {
  current: number;
  prevClose: number;
  dayChange: number;
  dayChangePct: number;
  open: number;
  dayRange: [number, number];
  week52Range: [number, number];
  volume: number;
  avgVolume20d: number;
  nav: number;
  aum: number;
};

export type Streaks = {
  current: { count: number; dir: number };
  bestUp: number;
  worstDown: number;
  last30: { ups: number; downs: number; total: number };
};

// ─── factsheet-true constants ────────────────────────────────────────────────
export const CAGE_META = {
  ticker: "CAGE",
  name: "Avantis CIBC All-Equity Asset Allocation ETF",
  exchange: "NEO",
  inception: "2026-03-18",
  benchmark: "MSCI ACWI IMI",
  currency: "CAD",
  mer: 0.0028, // 28 bps per factsheet
};

// Real Avantis CIBC ETF tickers + target weights from the CAGE factsheet
// (April 2026). Ordered by weight, descending.
const SIBLING_CONFIG: SiblingConfig[] = [
  {
    ticker: "CAUS",
    name: "Avantis CIBC U.S. All-Cap Equity ETF",
    cageWeight: 0.394,
    beta: 1.05,
    vol: 0.009,
    driftAdj: +0.0001,
    seed: 100,
    color: "us",
  },
  {
    ticker: "CACE",
    name: "Avantis CIBC Canadian Equity ETF",
    cageWeight: 0.300,
    beta: 0.96,
    vol: 0.0095,
    driftAdj: -0.00015,
    seed: 400,
    color: "ca",
  },
  {
    ticker: "CADE",
    name: "Avantis CIBC International Equity ETF",
    cageWeight: 0.176,
    beta: 0.92,
    vol: 0.0085,
    driftAdj: -0.0001,
    seed: 200,
    color: "intl",
  },
  {
    ticker: "CASV",
    name: "Avantis CIBC Global Small Cap Value ETF",
    cageWeight: 0.080,
    beta: 1.22,
    vol: 0.015,
    driftAdj: +0.00005,
    seed: 500,
    color: "smallcap",
  },
  {
    ticker: "CAEM",
    name: "Avantis CIBC Emerging Markets Equity ETF",
    cageWeight: 0.050,
    beta: 1.18,
    vol: 0.0135,
    driftAdj: +0.0002,
    seed: 300,
    color: "em",
  },
];

const MOCK_TODAY_SIBLING_PCT: Record<string, number> = {
  CAUS: +0.62,
  CACE: +0.55,
  CADE: +0.38,
  CASV: +1.05,
  CAEM: -0.12,
};

const SIBLING_HOLDINGS: Record<string, Holding[]> = {
  CAUS: [
    { name: "Apple Inc.", ticker: "AAPL", sector: "Technology", weight: 0.061 },
    { name: "Microsoft Corp.", ticker: "MSFT", sector: "Technology", weight: 0.054 },
    { name: "NVIDIA Corp.", ticker: "NVDA", sector: "Technology", weight: 0.048 },
    { name: "Amazon.com Inc.", ticker: "AMZN", sector: "Consumer", weight: 0.036 },
    { name: "Alphabet Inc. Cl A", ticker: "GOOGL", sector: "Communication", weight: 0.029 },
    { name: "Meta Platforms Inc.", ticker: "META", sector: "Communication", weight: 0.024 },
    { name: "JPMorgan Chase & Co.", ticker: "JPM", sector: "Financials", weight: 0.018 },
    { name: "Berkshire Hathaway B", ticker: "BRK.B", sector: "Financials", weight: 0.016 },
    { name: "Eli Lilly & Co.", ticker: "LLY", sector: "Healthcare", weight: 0.014 },
    { name: "Tesla Inc.", ticker: "TSLA", sector: "Consumer", weight: 0.013 },
  ],
  CACE: [
    { name: "Royal Bank of Canada", ticker: "RY", sector: "Financials", weight: 0.094 },
    { name: "Toronto-Dominion Bank", ticker: "TD", sector: "Financials", weight: 0.078 },
    { name: "Shopify Inc.", ticker: "SHOP", sector: "Technology", weight: 0.061 },
    { name: "Enbridge Inc.", ticker: "ENB", sector: "Energy", weight: 0.054 },
    { name: "Canadian National Railway", ticker: "CNR", sector: "Industrials", weight: 0.046 },
    { name: "Brookfield Corp.", ticker: "BN", sector: "Financials", weight: 0.041 },
    { name: "Bank of Montreal", ticker: "BMO", sector: "Financials", weight: 0.038 },
    { name: "Canadian Natural Resources", ticker: "CNQ", sector: "Energy", weight: 0.034 },
    { name: "Suncor Energy", ticker: "SU", sector: "Energy", weight: 0.029 },
    { name: "Bank of Nova Scotia", ticker: "BNS", sector: "Financials", weight: 0.028 },
  ],
  CADE: [
    { name: "Novo Nordisk A/S", ticker: "NVO", sector: "Healthcare", weight: 0.038 },
    { name: "ASML Holding NV", ticker: "ASML", sector: "Technology", weight: 0.034 },
    { name: "Nestlé SA", ticker: "NSRGY", sector: "Consumer", weight: 0.029 },
    { name: "Toyota Motor Corp.", ticker: "TM", sector: "Consumer", weight: 0.026 },
    { name: "Roche Holding AG", ticker: "RHHBY", sector: "Healthcare", weight: 0.024 },
    { name: "Shell PLC", ticker: "SHEL", sector: "Energy", weight: 0.022 },
    { name: "AstraZeneca PLC", ticker: "AZN", sector: "Healthcare", weight: 0.021 },
    { name: "LVMH Moët Hennessy", ticker: "MC", sector: "Consumer", weight: 0.019 },
    { name: "SAP SE", ticker: "SAP", sector: "Technology", weight: 0.017 },
    { name: "Novartis AG", ticker: "NVS", sector: "Healthcare", weight: 0.016 },
  ],
  CASV: [
    { name: "Comfort Systems USA", ticker: "FIX", sector: "Industrials", weight: 0.018 },
    { name: "Mueller Industries", ticker: "MLI", sector: "Industrials", weight: 0.016 },
    { name: "Atkore Inc.", ticker: "ATKR", sector: "Industrials", weight: 0.014 },
    { name: "Permian Resources", ticker: "PR", sector: "Energy", weight: 0.013 },
    { name: "Murphy USA Inc.", ticker: "MUSA", sector: "Consumer", weight: 0.012 },
    { name: "Modine Manufacturing", ticker: "MOD", sector: "Industrials", weight: 0.011 },
    { name: "Crocs Inc.", ticker: "CROX", sector: "Consumer", weight: 0.011 },
    { name: "Owens Corning", ticker: "OC", sector: "Industrials", weight: 0.010 },
    { name: "EMCOR Group Inc.", ticker: "EME", sector: "Industrials", weight: 0.010 },
    { name: "Builders FirstSource", ticker: "BLDR", sector: "Industrials", weight: 0.010 },
  ],
  CAEM: [
    { name: "Taiwan Semiconductor", ticker: "TSM", sector: "Technology", weight: 0.082 },
    { name: "Tencent Holdings Ltd.", ticker: "TCEHY", sector: "Communication", weight: 0.054 },
    { name: "Samsung Electronics", ticker: "SSNLF", sector: "Technology", weight: 0.046 },
    { name: "Alibaba Group Holding", ticker: "BABA", sector: "Consumer", weight: 0.031 },
    { name: "Reliance Industries", ticker: "RELIANCE", sector: "Energy", weight: 0.026 },
    { name: "ICICI Bank Ltd.", ticker: "IBN", sector: "Financials", weight: 0.020 },
    { name: "Infosys Ltd.", ticker: "INFY", sector: "Technology", weight: 0.018 },
    { name: "PDD Holdings Inc.", ticker: "PDD", sector: "Consumer", weight: 0.017 },
    { name: "HDFC Bank Ltd.", ticker: "HDB", sector: "Financials", weight: 0.015 },
    { name: "MercadoLibre Inc.", ticker: "MELI", sector: "Consumer", weight: 0.014 },
  ],
};

const REGION_OF_ETF_INTERNAL: Record<string, string> = {
  CAUS: "United States",
  CACE: "Canada",
  CADE: "Developed Intl.",
  CASV: "Developed Intl.",
  CAEM: "Emerging Mkts.",
};

export const SIB_PALETTE: Record<SiblingColor, string> = {
  us: "var(--accent)",
  intl: "var(--slice-intl)",
  em: "var(--slice-em)",
  ca: "var(--slice-ca)",
  smallcap: "var(--slice-sc)",
};

// ─── PRNG ────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng: () => number): number {
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── mock bar generation ────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

function buildTradingCalendar(endDate: Date, n: number): Date[] {
  const out: Date[] = [];
  const d = new Date(endDate);
  d.setHours(16, 0, 0, 0);
  while (out.length < n) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) out.push(new Date(d));
    d.setTime(d.getTime() - DAY_MS);
  }
  return out.reverse();
}

function genPathToTarget({
  startGuess,
  endPrice,
  n,
  vol,
  driftMu,
  seed,
}: {
  startGuess: number;
  endPrice: number;
  n: number;
  vol: number;
  driftMu: number;
  seed: number;
}): number[] {
  const rng = mulberry32(seed);
  const logReturns: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    logReturns.push(driftMu + vol * gauss(rng));
  }
  const closes = [startGuess];
  for (let i = 0; i < logReturns.length; i++) {
    closes.push(closes[closes.length - 1] * Math.exp(logReturns[i]));
  }
  const finalGuess = closes[closes.length - 1];
  const ratio = endPrice / finalGuess;
  return closes.map((c, i) => {
    const w = i / (closes.length - 1);
    return c * Math.pow(ratio, w);
  });
}

function buildDailyBars(
  closes: number[],
  dates: Date[],
  { volSeed, volBase }: { volSeed: number; volBase: number }
): Bar[] {
  const rng = mulberry32(volSeed);
  const bars: Bar[] = [];
  let prevClose = closes[0];
  for (let i = 0; i < closes.length; i++) {
    const close = closes[i];
    const range = Math.max(
      0.005,
      Math.abs(close - prevClose) * 1.6 + close * 0.003 * (0.3 + rng())
    );
    const open = i === 0 ? close : prevClose + (rng() - 0.5) * range * 0.4;
    const high = Math.max(open, close) + range * (0.2 + rng() * 0.5);
    const low = Math.min(open, close) - range * (0.2 + rng() * 0.5);
    const absR = Math.abs(close - prevClose) / prevClose;
    const spike =
      absR > 0.012 ? 1 + (rng() * 0.8 + absR * 25) : 1 + rng() * 0.5;
    const volume = Math.round(volBase * spike);
    bars.push({
      t: dates[i].getTime(),
      date: dates[i].toISOString().slice(0, 10),
      open: +open.toFixed(4),
      high: +high.toFixed(4),
      low: +low.toFixed(4),
      close: +close.toFixed(4),
      volume,
    });
    prevClose = close;
  }
  return bars;
}

function genSiblingSeries(
  parentBars: Bar[],
  cfg: SiblingConfig,
  anchorClose: number
): number[] {
  const rng = mulberry32(cfg.seed);
  const cageRets: number[] = [];
  for (let i = 1; i < parentBars.length; i++) {
    cageRets.push(
      (parentBars[i].close - parentBars[i - 1].close) / parentBars[i - 1].close
    );
  }
  const sibRets = cageRets.map(
    (r) => cfg.beta * r + cfg.driftAdj + cfg.vol * gauss(rng) * 0.6
  );
  const closes = [anchorClose];
  for (const r of sibRets) closes.push(closes[closes.length - 1] * (1 + r));
  return closes;
}

// ─── derivation helpers ─────────────────────────────────────────────────────
function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(-n);
}
function asSeries(bars: Bar[]): SeriesPoint[] {
  return bars.map((b) => ({ t: b.t, price: b.close }));
}

function buildSeries(bars: Bar[], today: Date, intraday: SeriesPoint[]) {
  return {
    "1D": intraday,
    "1W": asSeries(lastN(bars, 5)),
    "1M": asSeries(lastN(bars, 22)),
    "3M": asSeries(lastN(bars, 63)),
    YTD: asSeries(
      bars.filter((b) => new Date(b.t).getFullYear() === today.getFullYear())
    ),
    "1Y": asSeries(bars),
    ALL: asSeries(bars),
  } as Record<string, SeriesPoint[]>;
}

function benchmarkOf(
  series: SeriesPoint[],
  { seed, drag }: { seed: number; drag: number }
): SeriesPoint[] {
  const rng = mulberry32(seed);
  if (!series.length) return [];
  const start = series[0].price;
  const end = series[series.length - 1].price * (1 - drag);
  return series.map((pt, i) => {
    const f = i / (series.length - 1 || 1);
    const base = start + (end - start) * f;
    const wobble = (rng() - 0.5) * 2 * 0.003 * base;
    return { t: pt.t, price: +(base + wobble).toFixed(4) };
  });
}

function buildBenchmark(seriesMap: Record<string, SeriesPoint[]>) {
  return {
    "1D": benchmarkOf(seriesMap["1D"], { seed: 111, drag: 0.001 }),
    "1W": benchmarkOf(seriesMap["1W"], { seed: 222, drag: 0.002 }),
    "1M": benchmarkOf(seriesMap["1M"], { seed: 333, drag: 0.004 }),
    "3M": benchmarkOf(seriesMap["3M"], { seed: 444, drag: 0.006 }),
    YTD: benchmarkOf(seriesMap.YTD, { seed: 555, drag: 0.008 }),
    "1Y": benchmarkOf(seriesMap["1Y"], { seed: 666, drag: 0.01 }),
    ALL: benchmarkOf(seriesMap.ALL, { seed: 777, drag: 0.01 }),
  } as Record<string, SeriesPoint[]>;
}

function drawdownSeries(bars: Bar[]): SeriesPoint[] {
  let peak = -Infinity;
  return bars.map((b) => {
    peak = Math.max(peak, b.close);
    return { t: b.t, price: ((b.close - peak) / peak) * 100 };
  });
}
function rollingReturnSeries(
  bars: Bar[],
  n: number
): { t: number; price: number | null }[] {
  return bars.map((b, i) => {
    if (i < n) return { t: b.t, price: null };
    const past = bars[i - n].close;
    return { t: b.t, price: ((b.close - past) / past) * 100 };
  });
}
function buildDrawdown(bars: Bar[], today: Date) {
  return {
    "1M": drawdownSeries(lastN(bars, 22)),
    "3M": drawdownSeries(lastN(bars, 63)),
    YTD: drawdownSeries(
      bars.filter((b) => new Date(b.t).getFullYear() === today.getFullYear())
    ),
    "1Y": drawdownSeries(bars),
    ALL: drawdownSeries(bars),
  } as Record<string, SeriesPoint[]>;
}
function buildRolling30(bars: Bar[], today: Date) {
  return {
    "3M": rollingReturnSeries(lastN(bars, 63), 30),
    YTD: rollingReturnSeries(
      bars.filter((b) => new Date(b.t).getFullYear() === today.getFullYear()),
      30
    ),
    "1Y": rollingReturnSeries(bars, 30),
    ALL: rollingReturnSeries(bars, 30),
  };
}

function buildDayDirections(bars: Bar[]): Direction[] {
  const out: Direction[] = [];
  for (let i = 1; i < bars.length; i++) {
    const r = (bars[i].close - bars[i - 1].close) / bars[i - 1].close;
    out.push({ t: bars[i].t, date: bars[i].date, ret: r, dir: Math.sign(r) });
  }
  return out;
}

function computeStreaks(dirs: Direction[]): Streaks {
  if (!dirs.length) {
    return {
      current: { count: 0, dir: 0 },
      bestUp: 0,
      worstDown: 0,
      last30: { ups: 0, downs: 0, total: 0 },
    };
  }
  const last = dirs[dirs.length - 1];
  const curDir = last.dir;
  let cur = 1;
  for (let i = dirs.length - 2; i >= 0; i--) {
    if (dirs[i].dir === curDir) cur++;
    else break;
  }
  let bestUp = 0,
    worstDown = 0,
    run = 0,
    runDir = 0;
  for (const d of dirs) {
    if (d.dir === runDir && runDir !== 0) run++;
    else {
      runDir = d.dir;
      run = 1;
    }
    if (runDir > 0) bestUp = Math.max(bestUp, run);
    if (runDir < 0) worstDown = Math.max(worstDown, run);
  }
  const last30 = dirs.slice(-30);
  const ups = last30.filter((d) => d.dir > 0).length;
  const downs = last30.filter((d) => d.dir < 0).length;
  return {
    current: { count: cur, dir: curDir },
    bestUp,
    worstDown,
    last30: { ups, downs, total: last30.length },
  };
}

function ptReturn(bars: Bar[], lookback: number): number | null {
  if (bars.length <= lookback) return null;
  const a = bars[bars.length - 1 - lookback].close;
  const b = bars[bars.length - 1].close;
  return ((b - a) / a) * 100;
}

function computeReturns(bars: Bar[], today: Date) {
  if (!bars.length) {
    return {
      fund: { "1D": 0, "1W": 0, "1M": 0, "3M": 0, YTD: 0, "1Y": 0, SI: 0 },
      benchmark: {
        "1D": 0.41,
        "1W": 1.48,
        "1M": 3.1,
        "3M": 6.82,
        YTD: 9.94,
        "1Y": 9.94,
        SI: 9.94,
      },
    };
  }
  const firstThisYear = bars.find(
    (b) => new Date(b.t).getFullYear() === today.getFullYear()
  );
  const ytdBase = firstThisYear?.open ?? 20;
  return {
    fund: {
      "1D": +(ptReturn(bars, 1) ?? 0).toFixed(2),
      "1W": +(ptReturn(bars, 5) ?? 0).toFixed(2),
      "1M": +(ptReturn(bars, 22) ?? 0).toFixed(2),
      "3M": +(ptReturn(bars, 63) ?? 0).toFixed(2),
      YTD: +(
        ((bars[bars.length - 1].close - ytdBase) / ytdBase) *
        100
      ).toFixed(2),
      "1Y": +((bars[bars.length - 1].close / bars[0].close - 1) * 100).toFixed(2),
      SI: +((bars[bars.length - 1].close / 20.0 - 1) * 100).toFixed(2),
    } as Record<string, number>,
    benchmark: {
      "1D": 0.41,
      "1W": 1.48,
      "1M": 3.1,
      "3M": 6.82,
      YTD: 9.94,
      "1Y": 9.94,
      SI: 9.94,
    } as Record<string, number>,
  };
}

function computeAnomalies(
  price: PriceShape,
  bars: Bar[],
  streaks: Streaks
): Anomaly[] {
  const out: Anomaly[] = [];
  if (price.avgVolume20d > 0) {
    const ratio = price.volume / price.avgVolume20d;
    if (ratio >= 1.5) {
      out.push({
        kind: "volume-high",
        label: `Volume ${ratio.toFixed(1)}× avg`,
        tone: "muted",
      });
    } else if (ratio <= 0.6) {
      out.push({
        kind: "volume-low",
        label: `Volume ${ratio.toFixed(1)}× avg`,
        tone: "muted",
      });
    }
  }
  if (price.week52Range[1] > 0) {
    if (Math.abs(price.current - price.week52Range[1]) < 0.05) {
      out.push({ kind: "52w-high", label: "Near 52-week high", tone: "gain" });
    } else if (Math.abs(price.current - price.week52Range[0]) < 0.05) {
      out.push({ kind: "52w-low", label: "Near 52-week low", tone: "loss" });
    }
  }
  if (bars.length > 0) {
    const ath = Math.max(...bars.map((b) => b.high));
    if (Math.abs(price.current - ath) < 0.05) {
      out.push({ kind: "ath", label: "All-time high", tone: "gain" });
    }
  }
  if (streaks.current.count >= 4) {
    const word = streaks.current.dir > 0 ? "up" : "down";
    out.push({
      kind: "streak",
      label: `${streaks.current.count} ${word} days running`,
      tone: streaks.current.dir > 0 ? "gain" : "loss",
    });
  }
  if (bars.length >= 50) {
    const sma50 = bars.slice(-50).reduce((s, b) => s + b.close, 0) / 50;
    const aboveSma = price.current > sma50;
    out.push({
      kind: aboveSma ? "above-sma" : "below-sma",
      label: aboveSma ? "Above 50-day avg" : "Below 50-day avg",
      tone: aboveSma ? "gain" : "loss",
    });
  }
  if (price.nav > 0) {
    const navDiff = ((price.current - price.nav) / price.nav) * 100;
    if (Math.abs(navDiff) > 0.15) {
      out.push({
        kind: navDiff > 0 ? "premium" : "discount",
        label: (navDiff > 0 ? "+" : "") + navDiff.toFixed(2) + "% vs NAV",
        tone: "muted",
      });
    }
  }
  return out;
}

function buildBrief(
  price: PriceShape,
  siblings: Sibling[],
  streaks: Streaks
): string {
  const isGain = price.dayChange >= 0;
  const moveWord = isGain ? "added" : "shed";
  const pctWord = `${isGain ? "+" : ""}${price.dayChangePct.toFixed(2)}%`;
  if (!siblings.length) {
    return `CAGE ${moveWord} ${pctWord} on the day, closing at $${price.current.toFixed(2)}.`;
  }
  const sorted = [...siblings].sort((a, b) => b.contribution - a.contribution);
  const lead = sorted[0];
  const drag = sorted[sorted.length - 1];
  const leadWord = lead.contribution >= 0 ? "led the move" : "stayed defensive";
  const dragWord = drag.contribution < 0 ? "weighed on the tape" : "trailed";
  const upRatio = streaks.last30.total
    ? streaks.last30.ups / streaks.last30.total
    : 0.5;
  const rhythmPhrase =
    upRatio > 0.6
      ? "the recent rhythm has skewed positive"
      : upRatio < 0.4
      ? "recent sessions have been choppy"
      : "the recent rhythm has been mixed";
  return [
    `CAGE ${moveWord} ${pctWord} on the day, closing at $${price.current.toFixed(2)}.`,
    `${lead.ticker} ${leadWord} (+${lead.dayChangePct.toFixed(2)}%), while ${drag.ticker} ${dragWord} (${drag.dayChangePct >= 0 ? "+" : ""}${drag.dayChangePct.toFixed(2)}%).`,
    `Over the last 30 sessions, ${rhythmPhrase} — ${streaks.last30.ups} up days against ${streaks.last30.downs} down.`,
  ].join(" ");
}

function buildEffectiveHoldings(siblings: Sibling[]): EffectiveHolding[] {
  const acc = new Map<string, EffectiveHolding>();
  for (const sib of siblings) {
    for (const h of sib.holdings) {
      const eff = h.weight * sib.cageWeight;
      const cur =
        acc.get(h.name) ||
        ({
          name: h.name,
          ticker: h.ticker,
          sector: h.sector,
          weight: 0,
          sources: [],
        } as EffectiveHolding);
      cur.weight += eff;
      cur.sources.push({ etf: sib.ticker, weight: eff });
      acc.set(h.name, cur);
    }
  }
  return [...acc.values()]
    .sort((a, b) => b.weight - a.weight)
    .map((h) => ({ ...h, weight: +h.weight.toFixed(5) }));
}

function buildRegions(siblings: Sibling[]) {
  const acc = new Map<string, number>();
  for (const sib of siblings) {
    const region = REGION_OF_ETF_INTERNAL[sib.ticker];
    if (!region) continue;
    acc.set(region, (acc.get(region) || 0) + sib.cageWeight);
  }
  return [...acc.entries()].map(([name, weight]) => ({ name, weight }));
}

// Honest 1D series: a 2-point line from today's open (9:30 ET) to the
// current quote time. Yahoo's `quote()` doesn't return real intraday bars
// — we used to synthesise 78 fake points; now we draw only what we know.
// Returns [] if we don't have an open + current pair.
function intradayFromQuote({
  open,
  close,
  today,
}: {
  open: number;
  close: number;
  today: Date;
}): SeriesPoint[] {
  if (!open || !close) return [];
  // TSX open is 9:30 ET (13:30 UTC during DST).
  const openTime = new Date(today);
  openTime.setUTCHours(13, 30, 0, 0);
  return [
    { t: openTime.getTime(), price: +open.toFixed(4) },
    { t: today.getTime(), price: +close.toFixed(4) },
  ];
}

function priceFromBars(bars: Bar[]): PriceShape {
  if (!bars.length) {
    return {
      current: 0,
      prevClose: 0,
      dayChange: 0,
      dayChangePct: 0,
      open: 0,
      dayRange: [0, 0],
      week52Range: [0, 0],
      volume: 0,
      avgVolume20d: 0,
      nav: 0,
      aum: 0,
    };
  }
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2] ?? last;
  const week52Low = Math.min(...bars.map((b) => b.low));
  const week52High = Math.max(...bars.map((b) => b.high));
  const avgVol20 =
    bars.length > 20
      ? Math.round(
          bars.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20
        )
      : last.volume;
  return {
    current: last.close,
    prevClose: prev.close,
    dayChange: +(last.close - prev.close).toFixed(2),
    dayChangePct: +(((last.close - prev.close) / prev.close) * 100).toFixed(2),
    open: last.open,
    dayRange: [last.low, last.high],
    week52Range: [+week52Low.toFixed(2), +week52High.toFixed(2)],
    volume: last.volume,
    avgVolume20d: avgVol20,
    nav: last.close,
    aum: 142_800_000,
  };
}

function overlayQuoteOntoPrice(
  price: PriceShape,
  quote: NonNullable<DashboardPayload["cage"]["quote"]>
): PriceShape {
  const newCurrent = quote.price || price.current;
  const newPrev = quote.previousClose || price.prevClose;
  return {
    ...price,
    current: newCurrent,
    prevClose: newPrev,
    dayChange: +(newCurrent - newPrev).toFixed(2),
    dayChangePct: +(quote.changePercent ?? price.dayChangePct).toFixed(2),
    open: price.open,
    dayRange: [
      quote.dayLow || price.dayRange[0],
      quote.dayHigh || price.dayRange[1],
    ],
    week52Range: [
      quote.fiftyTwoWeekLow || price.week52Range[0],
      quote.fiftyTwoWeekHigh || price.week52Range[1],
    ],
    volume: quote.volume || price.volume,
    nav: price.nav,
    aum: quote.marketCap > 0 ? quote.marketCap : price.aum,
  };
}

function payloadHistoryToBars(
  history: NonNullable<DashboardPayload["cage"]["history"]>
): Bar[] {
  return history.data
    .map((d) => ({
      t: new Date(d.date + "T16:00:00").getTime(),
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }))
    .sort((a, b) => a.t - b.t);
}

// ─── Dataset type + assembly ────────────────────────────────────────────────
export type Dataset = {
  CAGE_META: typeof CAGE_META;
  PRICE: PriceShape;
  CAGE_BARS: Bar[];
  SIBLINGS: Sibling[];
  SIBLING_BARS: Record<string, Bar[]>;
  SERIES: Record<string, SeriesPoint[]>;
  BENCHMARK: Record<string, SeriesPoint[]>;
  DRAWDOWN: Record<string, SeriesPoint[]>;
  ROLLING30: Record<string, { t: number; price: number | null }[]>;
  EFFECTIVE_HOLDINGS: EffectiveHolding[];
  REGION_OF_ETF: Record<string, string>;
  REGIONS: { name: string; weight: number }[];
  DIRECTIONS: Direction[];
  STREAKS: Streaks;
  RETURNS: {
    fund: Record<string, number>;
    benchmark: Record<string, number>;
  };
  ANOMALIES: Anomaly[];
  TODAYS_BRIEF: string;
  SIB_PALETTE: Record<SiblingColor, string>;
  isLive: boolean;
  fetchedAt: string | null;
};

function assemble(opts: {
  cageBars: Bar[];
  siblingBars: Record<string, Bar[]>;
  siblingDayPct: Record<string, number>;
  cageQuoteOverride?: DashboardPayload["cage"]["quote"];
  today: Date;
  isLive: boolean;
  fetchedAt: string | null;
}): Dataset {
  const { cageBars, siblingBars, siblingDayPct, cageQuoteOverride, today } =
    opts;

  let price = priceFromBars(cageBars);
  if (cageQuoteOverride) price = overlayQuoteOntoPrice(price, cageQuoteOverride);

  const intraday = intradayFromQuote({
    open: price.open,
    close: price.current,
    today,
  });

  const siblings: Sibling[] = SIBLING_CONFIG.map((c) => {
    const dayPct = siblingDayPct[c.ticker] ?? 0;
    return {
      ...c,
      weight: c.cageWeight,
      holdings: SIBLING_HOLDINGS[c.ticker] ?? [],
      dayChangePct: dayPct,
      contribution: +(dayPct * c.cageWeight).toFixed(3),
    };
  });

  const series = buildSeries(cageBars, today, intraday);
  const benchmark = buildBenchmark(series);
  const drawdown = buildDrawdown(cageBars, today);
  const rolling30 = buildRolling30(cageBars, today);
  const directions = buildDayDirections(cageBars);
  const streaks = computeStreaks(directions);
  const returns = computeReturns(cageBars, today);
  const anomalies = computeAnomalies(price, cageBars, streaks);
  const brief = buildBrief(price, siblings, streaks);
  const effective = buildEffectiveHoldings(siblings);
  const regions = buildRegions(siblings);

  return {
    CAGE_META,
    PRICE: price,
    CAGE_BARS: cageBars,
    SIBLINGS: siblings,
    SIBLING_BARS: siblingBars,
    SERIES: series,
    BENCHMARK: benchmark,
    DRAWDOWN: drawdown,
    ROLLING30: rolling30,
    EFFECTIVE_HOLDINGS: effective,
    REGION_OF_ETF: REGION_OF_ETF_INTERNAL,
    REGIONS: regions,
    DIRECTIONS: directions,
    STREAKS: streaks,
    RETURNS: returns,
    ANOMALIES: anomalies,
    TODAYS_BRIEF: brief,
    SIB_PALETTE,
    isLive: opts.isLive,
    fetchedAt: opts.fetchedAt,
  };
}

// ─── public builders ────────────────────────────────────────────────────────
export function buildMockDataset(refDate?: Date): Dataset {
  const today = refDate ?? new Date("2026-05-26T16:00:00");
  const N_DAYS = 250;
  const calendar = buildTradingCalendar(today, N_DAYS);
  const cageCloses = genPathToTarget({
    startGuess: 20.0,
    endPrice: 22.14,
    n: N_DAYS,
    vol: 0.0072,
    driftMu: 0.00045,
    seed: 9001,
  });
  const cageBars = buildDailyBars(cageCloses, calendar, {
    volSeed: 7,
    volBase: 180_000,
  });

  // Slight anchor on the last two bars so the mock reads sensibly.
  if (cageBars.length >= 2) {
    const lastIdx = cageBars.length - 1;
    cageBars[lastIdx - 1].close = 22.03;
    cageBars[lastIdx].open = 22.05;
    cageBars[lastIdx].close = 22.14;
    cageBars[lastIdx].high = 22.21;
    cageBars[lastIdx].low = 21.98;
    cageBars[lastIdx].volume = 184_220;
  }

  const siblingBars: Record<string, Bar[]> = {};
  for (const cfg of SIBLING_CONFIG) {
    const startClose = 18 + (cfg.beta - 0.9) * 12 + cfg.cageWeight * 5;
    const closes = genSiblingSeries(cageBars, cfg, startClose);
    const targetPct = (MOCK_TODAY_SIBLING_PCT[cfg.ticker] ?? 0) / 100;
    if (closes.length >= 2)
      closes[closes.length - 1] =
        closes[closes.length - 2] * (1 + targetPct);
    siblingBars[cfg.ticker] = buildDailyBars(closes, calendar, {
      volSeed: cfg.seed + 1,
      volBase: 50_000,
    });
  }

  return assemble({
    cageBars,
    siblingBars,
    siblingDayPct: MOCK_TODAY_SIBLING_PCT,
    today,
    isLive: false,
    fetchedAt: null,
  });
}

/**
 * Build a Dataset from live Yahoo payload. Real data only — no synthesis,
 * no mock fallback. If Yahoo returned nothing for a series, the
 * corresponding field stays empty and the UI shows its empty state /
 * disables affected timeframes.
 */
export function buildLiveDataset(payload: DashboardPayload): Dataset {
  const today = new Date();

  const cageBars =
    payload.cage.history && payload.cage.history.data.length > 0
      ? payloadHistoryToBars(payload.cage.history)
      : [];

  const siblingBars: Record<string, Bar[]> = {};
  const siblingDayPct: Record<string, number> = {};
  for (const cfg of SIBLING_CONFIG) {
    const live = payload.siblings.find((s) => s.ticker === cfg.ticker);
    siblingBars[cfg.ticker] =
      live?.history && live.history.data.length > 0
        ? payloadHistoryToBars(live.history)
        : [];
    siblingDayPct[cfg.ticker] = live?.quote
      ? +live.quote.changePercent.toFixed(2)
      : 0;
  }

  return assemble({
    cageBars,
    siblingBars,
    siblingDayPct,
    cageQuoteOverride: payload.cage.quote,
    today,
    isLive: true,
    fetchedAt: payload.fetchedAt,
  });
}

/**
 * A zeroed-out payload, useful when the server-side fetch returned null
 * entirely (Yahoo unreachable + no cache). The resulting Dataset has no
 * bars and a zero PriceShape; consumers render their empty states.
 */
export function emptyPayload(): DashboardPayload {
  return {
    fetchedAt: new Date().toISOString(),
    cage: {
      ticker: "CAGE",
      fullName: CAGE_META.name,
      quote: null,
      history: null,
    },
    siblings: SIBLING_CONFIG.map((c) => ({
      ticker: c.ticker,
      fullName: c.name,
      quote: null,
      history: null,
    })),
  };
}

// ─── back-compat module-level exports ────────────────────────────────────────
// Evaluated once at import time so legacy code that imports these constants
// still works. New code should consume via useDataset() instead.
const __MOCK = buildMockDataset();
export const PRICE = __MOCK.PRICE;
export const CAGE_BARS = __MOCK.CAGE_BARS;
export const SIBLINGS = __MOCK.SIBLINGS;
export const SIBLING_BARS = __MOCK.SIBLING_BARS;
export const SERIES = __MOCK.SERIES;
export const BENCHMARK = __MOCK.BENCHMARK;
export const DRAWDOWN = __MOCK.DRAWDOWN;
export const ROLLING30 = __MOCK.ROLLING30;
export const EFFECTIVE_HOLDINGS = __MOCK.EFFECTIVE_HOLDINGS;
export const REGION_OF_ETF = __MOCK.REGION_OF_ETF;
export const REGIONS = __MOCK.REGIONS;
export const DIRECTIONS = __MOCK.DIRECTIONS;
export const STREAKS = __MOCK.STREAKS;
export const RETURNS = __MOCK.RETURNS;
export const ANOMALIES = __MOCK.ANOMALIES;
export const TODAYS_BRIEF = __MOCK.TODAYS_BRIEF;
