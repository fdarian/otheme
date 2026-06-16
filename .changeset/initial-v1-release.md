---
"otheme": major
---

Initial release of otheme v1.

Define a theme once as a standardized JSON and apply it consistently across all your tools. Supported targets: nvim, tmux, ghostty, claude-code.

Features:
- `otheme set <theme>` — apply a theme to all supported targets
- `otheme set <theme> --dry-run` — preview planned file writes and commands without applying
- `otheme alias` — list configured aliases
- `otheme alias set <dark|light> <theme>` — map an alias to a theme
- Bundled themes: vesper, atom-one-light, claude
- Alias state persisted to `~/.config/otheme/config.json`
