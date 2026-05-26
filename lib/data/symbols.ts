// Best-guess Yahoo tickers for CAGE + its five sibling Avantis CIBC ETFs.
// Cboe Canada / NEO tickers use the `.NE` suffix on Yahoo. If a symbol
// returns nothing, the plumbing fails soft (null → cache → null).

export interface SymbolConfig {
  yahoo: string;
  displayName: string;
  fullName: string;
}

export const SYMBOLS: Record<string, SymbolConfig> = {
  CAGE: {
    yahoo: "CAGE.NE",
    displayName: "CAGE",
    fullName: "Avantis CIBC All-Equity Asset Allocation ETF",
  },
  AVUS: {
    yahoo: "AVUS.NE",
    displayName: "AVUS",
    fullName: "Avantis CIBC US Equity ETF",
  },
  AVDE: {
    yahoo: "AVDE.NE",
    displayName: "AVDE",
    fullName: "Avantis CIBC International Equity ETF",
  },
  AVEM: {
    yahoo: "AVEM.NE",
    displayName: "AVEM",
    fullName: "Avantis CIBC Emerging Markets Equity ETF",
  },
  AVCA: {
    yahoo: "AVCA.NE",
    displayName: "AVCA",
    fullName: "Avantis CIBC Canadian Equity ETF",
  },
  AVSC: {
    yahoo: "AVSC.NE",
    displayName: "AVSC",
    fullName: "Avantis CIBC US Small Cap Value ETF",
  },
};

export const ALLOWED_SYMBOLS = Object.keys(SYMBOLS);
