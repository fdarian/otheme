---
"otheme": minor
---

Add hunk CLI theme target

New `hunk` target for the modem-dev/hunk git-diff TUI. Writes a managed TOML region at the top of `~/.config/hunk/config.toml`, setting `theme = "custom"` and rendering the shared palette into `[custom_theme]` and `[custom_theme.syntax]` tables. Preserves the user's existing config outside the managed region. Supports per-target overrides.
