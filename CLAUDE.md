## Workflow
- Always run `git fetch origin main && git reset --hard origin/main` at the start of any worktree before making changes.

## Commit messages
- Prefix every commit with a sequential `#N` (e.g. `#1 add leader cards`, `#2 fix dark-mode tokens`). Bump from the highest `#N` already in `git log`.
- Keep the subject short and plain. Skip the "what" — that's the diff. Say the "why" only when it isn't obvious.
- Skip the body unless something is genuinely unique or surprising (e.g. an unusual workaround, a non-obvious trade-off, a hack worth flagging).

## Data policy
- **Real Yahoo data only.** No mock fallbacks anywhere. If Yahoo returns nothing for a series, the field stays empty and the UI shows an empty state / greys out unavailable timeframes. `buildLiveDataset` in `app/_components/overview/data.ts` enforces this. `buildMockDataset` exists for testing but is not called from production paths.
- **Use the `.TO` suffix** for all six tickers (`CAGE.TO`, `CAUS.TO`, `CACE.TO`, `CADE.TO`, `CASV.TO`, `CAEM.TO`). They're dual-listed on Cboe Canada (`.NE`) and TSX (`.TO`); Yahoo's quote works on both but daily-bar history is only on `.TO`. Configured in `lib/data/symbols.ts`.
- Factsheet-true CAGE metadata lives in `app/_components/overview/data.ts` (MER 0.0028, inception 2026-03-18, exchange NEO). Sibling weights: CAUS 39.4 / CACE 30.0 / CADE 17.6 / CASV 8.0 / CAEM 5.0.

## Architecture
- `app/{page,inside,why,fund/[ticker]}/page.tsx` are **server components** that call `fetchDashboard()` and pass the payload to a thin client wrapper. Revalidate every 60 s.
- Client wrappers (`*Client.tsx`) build a `Dataset` via `buildLiveDataset(live ?? emptyPayload())` and provide it through `DatasetProvider`.
- Every consumer reads via `useDataset()`. No component imports runtime values from `./data` directly — only types.

See `HANDOFF.md` (repo root) for the full state snapshot, recent commits, open threads, and gotchas.
