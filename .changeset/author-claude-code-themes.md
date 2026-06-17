---
"otheme": minor
---

Author native Claude Code themes instead of mapping to built-in presets

The claude-code target now supports an `author` mode that generates a real Claude Code theme JSON at `~/.claude/themes/<theme-id>.json` (derived from each theme's own palette) and selects it via `theme = custom:<theme-id>` in settings. The built-in `vesper`, `atom-one-light`, and `claude` themes now use author mode, so each ships its own Claude Code theme. Map mode (set `theme` to the built-in `light`/`dark` preset) is still available.
