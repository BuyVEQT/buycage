# BuyCage — Session handoff

State snapshot at commit `#11`. A new Claude Code session rooted in this
repo can `@.claude/HANDOFF.md` to absorb the full context.

---

## What BuyCage is

A live dashboard for the **Avantis CIBC All-Equity Asset Allocation ETF
(CAGE.TO)** at **www.buycage.ca** (only the `www` subdomain is wired in
Vercel — apex still needs DNS). CAGE listed on TSX March 18 2026, MER
0.28 %, value + profitability tilt, fund-of-funds holding 5 sibling
Avantis CIBC ETFs.

Sibling tickers + target weights (from the CIBC factsheet):

| Ticker  | Name                                     | Weight |
|---------|------------------------------------------|--------|
| CAUS.TO | Avantis CIBC U.S. All-Cap Equity         | 39.4 % |
| CACE.TO | Avantis CIBC Canadian Equity             | 30.0 % |
| CADE.TO | Avantis CIBC International Equity        | 17.6 % |
| CASV.TO | Avantis CIBC Global Small Cap Value      | 8.0 %  |
| CAEM.TO | Avantis CIBC Emerging Markets Equity     | 5.0 %  |

---

## Stack

- Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, TypeScript
- Fonts: Geist + Geist Mono + Instrument Serif via `next/font`
- Charts: `recharts@3`, `d3`, `d3-sankey`
- Data: `yahoo-finance2`, two-tier cache (in-memory + `/tmp` on Vercel)
- Hosted on Vercel under `BuyVEQT/buycage` (private GitHub repo)

---

## File map

```
lib/data/
  types.ts            QuoteData / HistoricalData
  symbols.ts          CAGE + siblings, all .TO
  cache.ts            in-memory + filesystem, 24h TTL
  yahoo-fallback.ts   yahoo-finance2 client (timeout, end-at-yesterday, null-row filter)
  market-hours.ts     TSX hours helper
  market-data.ts      orchestrator (Yahoo → cache → throw)
  logger.ts           one-line per fetch
  fetchDashboard.ts   parallel CAGE + 5 siblings → DashboardPayload
  index.ts            barrel

app/
  page.tsx                            server → <OverviewClient/>
  inside/page.tsx                     server → <InsideClient/>
  why/page.tsx                        server → <WhyClient/>
  fund/[ticker]/page.tsx              SSG for CAUS/CACE/CADE/CASV/CAEM → <FundClient/>
  api/
    quote/[symbol]/route.ts           GET single quote (nodejs runtime)
    history/[symbol]/route.ts         GET daily history (size=compact|full)
    snapshot/route.ts                 GET all 6 symbols in parallel — for sanity checks

app/_components/
  overview/
    data.ts             Dataset type, buildLiveDataset, buildMockDataset, emptyPayload
    dataset.tsx         DatasetProvider, useDataset()
    OverviewClient.tsx  client wrapper (dynamic-imports Overview with ssr:false)
    Overview.tsx        page composition (Hero + Chart + Brief + Leaderboard + TeaserStrip)
    Header.tsx          shell header with nav (overview / why / inside)
    Footer.tsx          shell footer + methodology drawer
    PriceChart.tsx      Recharts chart w/ TF availability gating
    ChartVitals.tsx     compact open/prev/range/52w/AUM strip
    DayVitals.tsx       CageGlyph (animated SVG) + BellCurve + StreakBadge
    Leaderboard.tsx     leader + ranked cards (links to /fund/{ticker})
    Rhythm.tsx          12-wk calendar heatmap
    XRay.tsx            3-ring sunburst
    MoneyFlow.tsx       Sankey ($X → siblings → regions)
    TeaserStrip.tsx     3 cards linking to /inside
    TodaysBrief.tsx     auto-generated 3-sentence brief, fades in
    AnomalyRow.tsx      pill chips (volume, 52w high/low, streak, SMA, NAV)
    MethodologyDrawer.tsx
    icons.tsx, shared.tsx, RangeBar.tsx
  inside/
    InsideClient.tsx, InsideCage.tsx       deep-dive page (Rhythm + XRay + Flow + Returns)
  fund/
    FundClient.tsx, Fund.tsx, FundChart.tsx  per-sibling detail
  why/
    WhyClient.tsx, Why.tsx                 long-form article
```

---

## Render flow

1. `app/X/page.tsx` (server) → `await fetchDashboard().catch(() => null)`
2. Renders `<XClient live={payload} />` (client component)
3. `XClient` builds dataset: `buildLiveDataset(live ?? emptyPayload())`
4. Wraps page in `<DatasetProvider value={dataset}>`
5. Dynamic-imports the heavy page component with `ssr: false` (charts need real DOM)
6. All consumer components read via `useDataset()`

---

## Real-data policy (important)

The `#7` commit dropped every mock fallback. Specifics:

- `buildLiveDataset` never substitutes mock bars. Empty Yahoo history → empty `cageBars` / empty `SIBLING_BARS[ticker]`.
- 1D intraday is now a **2-point line** `[open, current]` from the quote — no more 78-point synthesised noise.
- `PriceChart` and `FundChart` auto-grey TF pills when bars are insufficient (1W needs 5, 1M 22, 3M 63, 1Y 252, YTD ≥1 this-year bar). Default TF picks the longest available.
- `DayVitals` bell curve hides under a "not enough history yet" note when daily returns < 20.
- Chart shows an empty-state placeholder when zero bars exist.

`buildMockDataset` is preserved for testing / dev only.

---

## Gotchas worth knowing

1. **Use `.TO`, never `.NE`.** Yahoo's quote endpoint works on both Cboe Canada (`.NE`) and TSX (`.TO`), but daily-bar backfill is only on `.TO`. Switching to `.NE` quietly returns 1 row of history for every symbol.
2. **No CSS `transform` with `transformBox: fill-box` on SVG `<g>`.** Chrome desktop renders the empty `<g>` with a zero-size fill box and snaps to (0,0). Use the native SVG `transform=` attribute. CageGlyph orb, BellCurve pin, "Z" particles all hit this — see `#8` for the fix.
3. **Yahoo `historical()` defaults end-period to today.** Today's row can come back with `close: null` before the market data finalises. `yahoo-fallback.ts` caps period2 at yesterday and filters null-close rows defensively.
4. **`ssr: false` is only allowed in client components.** Page-level `dynamic(..., { ssr: false })` requires `"use client"`. That's why we have `*Client.tsx` wrappers.
5. **`/tmp` on Vercel is ephemeral per container** — the in-memory tier is what actually survives between requests on a warm container. Filesystem only matters between cold starts on the same container.
6. **Don't cache empty data.** `market-data.ts` guards with `if (fresh && fresh.data.length > 0)` before writing — otherwise one bad fetch poisons the cache for 24 h.

---

## Recent commits

| # | Subject |
|---|---------|
| 1  | record commit-message conventions in CLAUDE.md |
| 2  | wire Yahoo data plumbing (lib/data + /api/quote, history, snapshot) |
| 3  | try sibling tickers on .TO instead of .NE  *(reverted in #4)* |
| 4  | use real Avantis CIBC tickers from CAGE factsheet |
| 5  | wire dashboard to live Yahoo data via server-fetched Dataset context |
| 6  | fix sparkline overflow + add card hovers |
| 7  | drop mock fallback — real Yahoo data only, grey out unsupported TFs |
| 8  | switch tickers to .TO + fix CageGlyph CSS transform |
| 9  | home page refresh (Hero contextual stats, TeaserStrip hover, nav swap, /why stub) |
| 10 | /fund/[ticker] minimal detail pages |
| 11 | /why article: long-form Avantis pitch with citations |

Next commit is **#12**.

---

## Open / not-yet-done threads

- **Mobile responsive pass** — never done a focused pass. Hero contextual stats are `hidden md:flex` so mobile users get nothing useful in that slot. Likely needs reflowing.
- **Vercel apex domain** — only `www.buycage.ca` is configured in Vercel → Domains; apex `buycage.ca` still 404s. Needs to be added in Vercel UI; Cloudflare auto-configure will write the A record.
- **`/why` revisions** — the article was synthesized from research-agent output and may want copy editing / personal voice pass. Honest about CAGE's tracking-error downside which the user explicitly wanted.
- **`/fund/[ticker]` is the "minimal" scope option.** Could enrich with sector breakdown, fund summary text, etc. via `yahoo-finance2`'s `quoteSummary` if the user wants.
- **`/inside` page hover effects** were added at the card outer level but the inner widgets (Rhythm calendar cells, XRay sunburst, MoneyFlow Sankey, ReturnsTable) could use polish.
- **`vercel.json` / Vercel project ID** for this repo isn't pinned in code — connection lives in the Vercel dashboard. Worth knowing if migrating accounts.

---

## Sub-agent research pattern that worked well

The `/why` article was researched by **three Opus agents running in parallel in the background**:

1. Avantis methodology + Fama-French / Novy-Marx / Wahal-Repetto academic basis
2. PWL Capital + Ben Felix's Canadian evidence-based take
3. Head-to-head vs VEQT / XEQT / AVGE + honest "who is this for"

Each returned ~700-900 words with citation URLs. I consolidated into the final `Why.tsx`. Pattern is reusable for any other long-form content needing primary-source research.

---

## Quick verification commands

```bash
# Real Yahoo data sanity check (all 6 symbols)
curl -sS https://www.buycage.ca/api/snapshot | jq

# Single ticker quote
curl -sS https://www.buycage.ca/api/quote/CAGE | jq

# Daily history
curl -sS "https://www.buycage.ca/api/history/CAGE?size=compact" | jq '.data | length'
```

---

## Repo metadata

- GitHub: **BuyVEQT/buycage** (private)
- Vercel project: **matthamed-7629s-projects/buycage**
- Live URL: **https://www.buycage.ca** (www only; apex pending)
- Default branch: `main`
- Author identity: Matt <matt.hamed@gmail.com>
