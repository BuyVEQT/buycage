// Single mock data source for BuyCage v2.
// Ported from the design-handoff bundle. All figures are illustrative.

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

export type SiblingConfig = {
  ticker: string;
  name: string;
  cageWeight: number;
  beta: number;
  vol: number;
  driftAdj: number;
  seed: number;
  color: "us" | "intl" | "em" | "ca" | "smallcap";
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

// ─── meta ────────────────────────────────────────────────────────────────────
export const CAGE_META = {
  ticker: "CAGE",
  name: "Avantis CIBC All-Equity Asset Allocation ETF",
  exchange: "TSX",
  inception: "2026-03-04",
  benchmark: "MSCI ACWI IMI",
  currency: "CAD",
  mer: 0.0024,
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

// ─── trading calendar + path ─────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
function buildTradingCalendar(endDate: Date, n: number): Date[] {
  const out: Date[] = [];
  let d = new Date(endDate);
  d.setHours(16, 0, 0, 0);
  while (out.length < n) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) out.push(new Date(d));
    d = new Date(d.getTime() - DAY_MS);
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

const TODAY = new Date("2026-05-26T16:00:00");
const N_DAYS = 250;
const calendar = buildTradingCalendar(TODAY, N_DAYS);

const cageCloses = genPathToTarget({
  startGuess: 20.0,
  endPrice: 22.14,
  n: N_DAYS,
  vol: 0.0072,
  driftMu: 0.00045,
  seed: 9001,
});

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

const cageBars = buildDailyBars(cageCloses, calendar, {
  volSeed: 7,
  volBase: 180_000,
});

const lastIdx = cageBars.length - 1;
cageBars[lastIdx - 1].close = 22.03;
cageBars[lastIdx].open = 22.05;
cageBars[lastIdx].close = 22.14;
cageBars[lastIdx].high = 22.21;
cageBars[lastIdx].low = 21.98;
cageBars[lastIdx].volume = 184_220;

export const CAGE_BARS = cageBars;

// ─── per-sibling ETFs ────────────────────────────────────────────────────────
const SIBLING_CONFIG: SiblingConfig[] = [
  {
    ticker: "AVUS.NE",
    name: "Avantis CIBC US Equity ETF",
    cageWeight: 0.42,
    beta: 1.05,
    vol: 0.009,
    driftAdj: +0.0001,
    seed: 100,
    color: "us",
  },
  {
    ticker: "AVDE.NE",
    name: "Avantis CIBC International Equity ETF",
    cageWeight: 0.26,
    beta: 0.92,
    vol: 0.0085,
    driftAdj: -0.0001,
    seed: 200,
    color: "intl",
  },
  {
    ticker: "AVEM.NE",
    name: "Avantis CIBC Emerging Markets Equity ETF",
    cageWeight: 0.14,
    beta: 1.18,
    vol: 0.0135,
    driftAdj: +0.0002,
    seed: 300,
    color: "em",
  },
  {
    ticker: "AVCA.NE",
    name: "Avantis CIBC Canadian Equity ETF",
    cageWeight: 0.12,
    beta: 0.96,
    vol: 0.0095,
    driftAdj: -0.00015,
    seed: 400,
    color: "ca",
  },
  {
    ticker: "AVSC.NE",
    name: "Avantis CIBC US Small Cap Value ETF",
    cageWeight: 0.06,
    beta: 1.22,
    vol: 0.015,
    driftAdj: +0.00005,
    seed: 500,
    color: "smallcap",
  },
];

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

const TODAY_SIBLING_PCT: Record<string, number> = {
  "AVUS.NE": +0.62,
  "AVDE.NE": +0.38,
  "AVEM.NE": -0.12,
  "AVCA.NE": +0.55,
  "AVSC.NE": +1.05,
};

export const SIBLING_BARS: Record<string, Bar[]> = {};
for (const cfg of SIBLING_CONFIG) {
  const startClose = 18 + (cfg.beta - 0.9) * 12 + cfg.cageWeight * 5;
  const closes = genSiblingSeries(cageBars, cfg, startClose);
  const targetPct = TODAY_SIBLING_PCT[cfg.ticker] / 100;
  closes[closes.length - 1] = closes[closes.length - 2] * (1 + targetPct);
  SIBLING_BARS[cfg.ticker] = buildDailyBars(closes, calendar, {
    volSeed: cfg.seed + 1,
    volBase: 50_000,
  });
}

// ─── PRICE summary ───────────────────────────────────────────────────────────
const last = cageBars[lastIdx];
const prev = cageBars[lastIdx - 1];
const week52Low = Math.min(...cageBars.map((b) => b.low));
const week52High = Math.max(...cageBars.map((b) => b.high));
const avgVol20 = Math.round(
  cageBars.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20
);

export const PRICE = {
  current: last.close,
  prevClose: prev.close,
  dayChange: +(last.close - prev.close).toFixed(2),
  dayChangePct: +(((last.close - prev.close) / prev.close) * 100).toFixed(2),
  open: last.open,
  dayRange: [last.low, last.high] as [number, number],
  week52Range: [+week52Low.toFixed(2), +week52High.toFixed(2)] as [number, number],
  volume: last.volume,
  avgVolume20d: avgVol20,
  nav: 22.13,
  aum: 142_800_000,
};

// ─── intraday 1D ─────────────────────────────────────────────────────────────
function genIntraday({
  open,
  close,
  dayHigh,
  dayLow,
}: {
  open: number;
  close: number;
  dayHigh: number;
  dayLow: number;
}): SeriesPoint[] {
  const N = 78;
  const rng = mulberry32(13);
  const arr: number[] = [];
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    const base = open + (close - open) * f;
    const noise = (rng() - 0.5) * (dayHigh - dayLow) * 0.18;
    let p = base + noise;
    p = Math.min(dayHigh, Math.max(dayLow, p));
    arr.push(p);
  }
  arr[0] = open;
  arr[N - 1] = close;
  const startT = TODAY.getTime() - 6.5 * 60 * 60 * 1000;
  return arr.map((price, i) => ({
    t: startT + i * 5 * 60 * 1000,
    price: +price.toFixed(4),
  }));
}
const intraday1D = genIntraday({
  open: PRICE.open,
  close: PRICE.current,
  dayHigh: PRICE.dayRange[1],
  dayLow: PRICE.dayRange[0],
});

function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(-n);
}
function asSeries(bars: Bar[]): SeriesPoint[] {
  return bars.map((b) => ({ t: b.t, price: b.close }));
}

export const SERIES: Record<string, SeriesPoint[]> = {
  "1D": intraday1D,
  "1W": asSeries(lastN(cageBars, 5)),
  "1M": asSeries(lastN(cageBars, 22)),
  "3M": asSeries(lastN(cageBars, 63)),
  YTD: asSeries(
    cageBars.filter((b) => new Date(b.t).getFullYear() === TODAY.getFullYear())
  ),
  "1Y": asSeries(cageBars),
  ALL: asSeries(cageBars),
};

// ─── benchmark ───────────────────────────────────────────────────────────────
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

export const BENCHMARK: Record<string, SeriesPoint[]> = {
  "1D": benchmarkOf(SERIES["1D"], { seed: 111, drag: 0.001 }),
  "1W": benchmarkOf(SERIES["1W"], { seed: 222, drag: 0.002 }),
  "1M": benchmarkOf(SERIES["1M"], { seed: 333, drag: 0.004 }),
  "3M": benchmarkOf(SERIES["3M"], { seed: 444, drag: 0.006 }),
  YTD: benchmarkOf(SERIES["YTD"], { seed: 555, drag: 0.008 }),
  "1Y": benchmarkOf(SERIES["1Y"], { seed: 666, drag: 0.01 }),
  ALL: benchmarkOf(SERIES["ALL"], { seed: 777, drag: 0.01 }),
};

// ─── chart modes ─────────────────────────────────────────────────────────────
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

export const DRAWDOWN: Record<string, SeriesPoint[]> = {
  "1M": drawdownSeries(lastN(cageBars, 22)),
  "3M": drawdownSeries(lastN(cageBars, 63)),
  YTD: drawdownSeries(
    cageBars.filter((b) => new Date(b.t).getFullYear() === TODAY.getFullYear())
  ),
  "1Y": drawdownSeries(cageBars),
  ALL: drawdownSeries(cageBars),
};
export const ROLLING30: Record<string, { t: number; price: number | null }[]> = {
  "3M": rollingReturnSeries(lastN(cageBars, 63), 30),
  YTD: rollingReturnSeries(
    cageBars.filter((b) => new Date(b.t).getFullYear() === TODAY.getFullYear()),
    30
  ),
  "1Y": rollingReturnSeries(cageBars, 30),
  ALL: rollingReturnSeries(cageBars, 30),
};

// ─── holdings + effective weights ────────────────────────────────────────────
const SIBLING_HOLDINGS: Record<string, Holding[]> = {
  "AVUS.NE": [
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
  "AVDE.NE": [
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
  "AVEM.NE": [
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
  "AVCA.NE": [
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
  "AVSC.NE": [
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
};

export const SIBLINGS: Sibling[] = SIBLING_CONFIG.map((c) => ({
  ...c,
  weight: c.cageWeight,
  holdings: SIBLING_HOLDINGS[c.ticker],
  dayChangePct: TODAY_SIBLING_PCT[c.ticker],
  contribution: +(TODAY_SIBLING_PCT[c.ticker] * c.cageWeight).toFixed(3),
}));

export const EFFECTIVE_HOLDINGS: EffectiveHolding[] = (() => {
  const acc = new Map<string, EffectiveHolding>();
  for (const sib of SIBLINGS) {
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
})();

export const REGION_OF_ETF: Record<string, string> = {
  "AVUS.NE": "United States",
  "AVDE.NE": "Developed Intl.",
  "AVEM.NE": "Emerging Mkts.",
  "AVCA.NE": "Canada",
  "AVSC.NE": "United States",
};
export const REGIONS = (() => {
  const acc = new Map<string, number>();
  for (const sib of SIBLINGS) {
    const region = REGION_OF_ETF[sib.ticker];
    acc.set(region, (acc.get(region) || 0) + sib.cageWeight);
  }
  return [...acc.entries()].map(([name, weight]) => ({ name, weight }));
})();

// ─── streaks ─────────────────────────────────────────────────────────────────
export type Direction = { t: number; date: string; ret: number; dir: number };
function buildDayDirections(bars: Bar[]): Direction[] {
  const out: Direction[] = [];
  for (let i = 1; i < bars.length; i++) {
    const r = (bars[i].close - bars[i - 1].close) / bars[i - 1].close;
    out.push({ t: bars[i].t, date: bars[i].date, ret: r, dir: Math.sign(r) });
  }
  return out;
}
export const DIRECTIONS = buildDayDirections(cageBars);

function computeStreaks(dirs: Direction[]) {
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
export const STREAKS = computeStreaks(DIRECTIONS);

// ─── returns ────────────────────────────────────────────────────────────────
function ptReturn(bars: Bar[], lookback: number): number | null {
  if (bars.length <= lookback) return null;
  const a = bars[bars.length - 1 - lookback].close;
  const b = bars[bars.length - 1].close;
  return ((b - a) / a) * 100;
}
const firstThisYear = cageBars.find(
  (b) => new Date(b.t).getFullYear() === TODAY.getFullYear()
);
const ytdBase = firstThisYear?.open ?? 20;
export const RETURNS = {
  fund: {
    "1D": +(ptReturn(cageBars, 1) ?? 0).toFixed(2),
    "1W": +(ptReturn(cageBars, 5) ?? 0).toFixed(2),
    "1M": +(ptReturn(cageBars, 22) ?? 0).toFixed(2),
    "3M": +(ptReturn(cageBars, 63) ?? 0).toFixed(2),
    YTD: +(
      ((cageBars[cageBars.length - 1].close - ytdBase) / ytdBase) *
      100
    ).toFixed(2),
    "1Y": +((cageBars[cageBars.length - 1].close / cageBars[0].close - 1) * 100).toFixed(2),
    SI: +((cageBars[cageBars.length - 1].close / 20.0 - 1) * 100).toFixed(2),
  } as Record<string, number>,
  benchmark: {
    "1D": 0.41,
    "1W": 1.48,
    "1M": 3.10,
    "3M": 6.82,
    YTD: 9.94,
    "1Y": 9.94,
    SI: 9.94,
  } as Record<string, number>,
};

// ─── anomalies ───────────────────────────────────────────────────────────────
function computeAnomalies(): Anomaly[] {
  const out: Anomaly[] = [];
  const ratio = PRICE.volume / PRICE.avgVolume20d;
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
  if (Math.abs(PRICE.current - PRICE.week52Range[1]) < 0.05) {
    out.push({ kind: "52w-high", label: "Near 52-week high", tone: "gain" });
  } else if (Math.abs(PRICE.current - PRICE.week52Range[0]) < 0.05) {
    out.push({ kind: "52w-low", label: "Near 52-week low", tone: "loss" });
  }
  const ath = Math.max(...cageBars.map((b) => b.high));
  if (Math.abs(PRICE.current - ath) < 0.05) {
    out.push({ kind: "ath", label: "All-time high", tone: "gain" });
  }
  if (STREAKS.current.count >= 4) {
    const word = STREAKS.current.dir > 0 ? "up" : "down";
    out.push({
      kind: "streak",
      label: `${STREAKS.current.count} ${word} days running`,
      tone: STREAKS.current.dir > 0 ? "gain" : "loss",
    });
  }
  const sma50 = cageBars.slice(-50).reduce((s, b) => s + b.close, 0) / 50;
  const aboveSma = PRICE.current > sma50;
  out.push({
    kind: aboveSma ? "above-sma" : "below-sma",
    label: aboveSma ? "Above 50-day avg" : "Below 50-day avg",
    tone: aboveSma ? "gain" : "loss",
  });
  const navDiff = ((PRICE.current - PRICE.nav) / PRICE.nav) * 100;
  if (Math.abs(navDiff) > 0.15) {
    out.push({
      kind: navDiff > 0 ? "premium" : "discount",
      label: (navDiff > 0 ? "+" : "") + navDiff.toFixed(2) + "% vs NAV",
      tone: "muted",
    });
  }
  return out;
}
export const ANOMALIES = computeAnomalies();

// ─── today's brief ───────────────────────────────────────────────────────────
function buildBrief(): string {
  const isGain = PRICE.dayChange >= 0;
  const moveWord = isGain ? "added" : "shed";
  const pctWord = `${isGain ? "+" : ""}${PRICE.dayChangePct.toFixed(2)}%`;
  const sorted = [...SIBLINGS].sort((a, b) => b.contribution - a.contribution);
  const lead = sorted[0];
  const drag = sorted[sorted.length - 1];
  const leadWord = lead.contribution >= 0 ? "led the move" : "stayed defensive";
  const dragWord =
    drag.contribution < 0 ? "weighed on the tape" : "trailed";
  const upRatio = STREAKS.last30.ups / STREAKS.last30.total;
  const rhythmPhrase =
    upRatio > 0.6
      ? "the recent rhythm has skewed positive"
      : upRatio < 0.4
      ? "recent sessions have been choppy"
      : "the recent rhythm has been mixed";

  return [
    `CAGE ${moveWord} ${pctWord} on the day, closing at $${PRICE.current.toFixed(2)}.`,
    `${lead.ticker.replace(".NE", "")} ${leadWord} (+${lead.dayChangePct.toFixed(2)}%), while ${drag.ticker.replace(".NE", "")} ${dragWord} (${drag.dayChangePct >= 0 ? "+" : ""}${drag.dayChangePct.toFixed(2)}%).`,
    `Over the last 30 sessions, ${rhythmPhrase} — ${STREAKS.last30.ups} up days against ${STREAKS.last30.downs} down.`,
  ].join(" ");
}
export const TODAYS_BRIEF = buildBrief();

// ─── palette ────────────────────────────────────────────────────────────────
export const SIB_PALETTE: Record<Sibling["color"], string> = {
  us: "var(--accent)",
  intl: "var(--slice-intl)",
  em: "var(--slice-em)",
  ca: "var(--slice-ca)",
  smallcap: "var(--slice-sc)",
};
