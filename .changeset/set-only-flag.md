---
"otheme": minor
---

Add an `--only [target]` flag to `otheme set` to restrict the apply to specific targets

`otheme set <theme> --only tmux --only nvim` applies the theme only to the listed targets. The flag is repeatable and validated against the known target ids, so typos are rejected at parse time. Requesting a valid-but-disabled target fails with a clear error instead of silently doing nothing.
