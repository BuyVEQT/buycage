export type DataSource = "yahoo-finance" | "cache";

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  latestTradingDay: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  dividendYield: number;
  source: DataSource;
  fetchedAt: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
  dividendAmount: number;
}

export interface HistoricalData {
  symbol: string;
  data: HistoricalDataPoint[];
  source: DataSource;
  fetchedAt: string;
}
