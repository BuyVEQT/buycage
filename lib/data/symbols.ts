// Real Avantis CIBC ETF tickers pulled from the CAGE fact sheet
// (cibc-fund-snapshot-cage-en.pdf, dated April 2026).
//
// Trying `.NE` first since that's what worked for CAGE on Yahoo. If a
// sibling 404s, fall back to `.TO`.

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
  CAUS: {
    yahoo: "CAUS.NE",
    displayName: "CAUS",
    fullName: "Avantis CIBC U.S. All-Cap Equity ETF",
  },
  CACE: {
    yahoo: "CACE.NE",
    displayName: "CACE",
    fullName: "Avantis CIBC Canadian Equity ETF",
  },
  CADE: {
    yahoo: "CADE.NE",
    displayName: "CADE",
    fullName: "Avantis CIBC International Equity ETF",
  },
  CASV: {
    yahoo: "CASV.NE",
    displayName: "CASV",
    fullName: "Avantis CIBC Global Small Cap Value ETF",
  },
  CAEM: {
    yahoo: "CAEM.NE",
    displayName: "CAEM",
    fullName: "Avantis CIBC Emerging Markets Equity ETF",
  },
};

export const ALLOWED_SYMBOLS = Object.keys(SYMBOLS);
