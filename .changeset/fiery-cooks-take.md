---
"otheme": minor
---

Auto-apply the current theme to newly spawned Neovim instances

Previously `otheme set` only live-updated already-running nvim sessions over their socket, so freshly launched instances kept the old colorscheme. otheme now persists the active theme to `~/.config/otheme/state.json`, renders a stable `~/.config/otheme/generated/nvim.lua`, and idempotently manages a marker-delimited block in `~/.config/nvim/init.lua` that sources it on startup — so new sessions always load the current theme. Running sessions still update live (now via `luafile` re-source). The per-theme `~/.local/share/nvim/site/colors/{name}.lua` write has been removed.
```

Drop that in a file like `.changeset/nvim-new-instance-theme.md`. If you want `@otheme/core` versioned alongside it too (it's private, so usually skipped), add a `"@otheme/core": minor` line — but for a published-package-only changelog, just `otheme` is correct.
