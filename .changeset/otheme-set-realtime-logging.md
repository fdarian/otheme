---
"otheme": minor
---

Show a real-time log of what `otheme set` is doing

`otheme set` previously printed only a single `applied <theme>` line. It now renders a live, plan-driven log grouped by target: each file write (`+`) and command (`$`) is shown at the moment it runs, with a spinner that resolves in place to its final state (or a `✗` plus stderr excerpt on failure), ending with a `✓ applied <theme> · N targets · <time>` summary. A failing target no longer aborts the run — it prints a clean error line, continues to the remaining targets, and the summary reports `⚠ applied <theme> with N errors`.

`otheme set --dry-run` now drives the same code path as a real apply, with mutating operations stubbed out (no files written, no state changes, no reload commands run) while read-only discovery still executes. This means the dry-run preview reflects exactly what a real apply would do, instead of a separately computed plan that could drift from it.
