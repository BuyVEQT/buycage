## Workflow
- Always run `git fetch origin main && git reset --hard origin/main` at the start of any worktree before making changes.

## Commit messages
- Prefix every commit with a sequential `#N` (e.g. `#1 add leader cards`, `#2 fix dark-mode tokens`). Bump from the highest `#N` already in `git log`.
- Keep the subject short and plain. Skip the "what" — that's the diff. Say the "why" only when it isn't obvious.
- Skip the body unless something is genuinely unique or surprising (e.g. an unusual workaround, a non-obvious trade-off, a hack worth flagging).
