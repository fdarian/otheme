---
"otheme": patch
---

Fix tmux command prompt not spanning full width on tmux 3.7

tmux 3.7 changed messages and the command prompt to overlay only as wide as their text instead of replacing the whole status line. The width is now controlled by a `fill` directive that only takes effect inside `message-format` — `fill` placed in `message-style`/`message-command-style` is ignored once expanded via `#{E:...}`. The tmux target now sets `message-format` with an explicit `#[fill=...]` directive and aligns `message-command-style` with `message-style` so the prompt text stays readable on the filled bar.
