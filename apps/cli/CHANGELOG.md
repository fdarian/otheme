# otheme

## 0.2.0

### Minor Changes

- 735de87: Add an `agent-dash` target to switch between dark and light themes

  New `agent-dash` target that patches the `theme` key in `~/.config/agent-dash/config.json` to `"dark"` or `"light"` based on the active theme's appearance. Existing config keys are preserved.

- 6e4d442: Author native Claude Code themes instead of mapping to built-in presets

  The claude-code target now supports an `author` mode that generates a real Claude Code theme JSON at `~/.claude/themes/<theme-id>.json` (derived from each theme's own palette) and selects it via `theme = custom:<theme-id>` in settings. The built-in `vesper`, `atom-one-light`, and `claude` themes now use author mode, so each ships its own Claude Code theme. Map mode (set `theme` to the built-in `light`/`dark` preset) is still available.

- 96f2f55: Add a `bat` target and derive git-delta's syntax theme from the palette

  New `bat` target that authors a real syntax theme from each theme's palette. It generates `~/.config/bat/themes/otheme-<theme-id>.tmTheme` (mapping the shared syntax tokens to TextMate scopes, the same semantic mapping the nvim target uses), points bat's config at it via `--theme`, and runs `bat cache --build` so the theme becomes available.

  The `git-delta` target is now a consumer of that theme. git-delta has no syntax engine — it delegates syntax highlighting to bat — so its generated `~/.config/git/otheme-delta.conf` now sets `syntax-theme = otheme-<theme-id>`, making diff token colors match the active theme instead of inheriting an unrelated third-party preset. All existing diff chrome (minus/plus/zero styles, emphasis, line-number colors, gitconfig include wiring) is unchanged.

  The two targets are decoupled — enabling git-delta does not enable bat automatically. When you enable `git-delta`, enable `bat` as well so the referenced syntax theme exists; otherwise delta falls back to its default highlighting for code tokens inside diffs.

- 4a0a085: Auto-apply the current theme to newly spawned Neovim instances

  Previously `otheme set` only live-updated already-running nvim sessions over their socket, so freshly launched instances kept the old colorscheme. otheme now persists the active theme to `~/.config/otheme/state.json`, renders a stable `~/.config/otheme/generated/nvim.lua`, and idempotently manages a marker-delimited block in `~/.config/nvim/init.lua` that sources it on startup — so new sessions always load the current theme. Running sessions still update live (now via `luafile` re-source). The per-theme `~/.local/share/nvim/site/colors/{name}.lua` write has been removed.

  ```

  Drop that in a file like `.changeset/nvim-new-instance-theme.md`. If you want `@otheme/core` versioned alongside it too (it's private, so usually skipped), add a `"@otheme/core": minor` line — but for a published-package-only changelog, just `otheme` is correct.
  ```

- 0eb3788: Add hunk CLI theme target

  New `hunk` target for the modem-dev/hunk git-diff TUI. Writes a managed TOML region at the top of `~/.config/hunk/config.toml`, setting `theme = "custom"` and rendering the shared palette into `[custom_theme]` and `[custom_theme.syntax]` tables. Preserves the user's existing config outside the managed region. Supports per-target overrides.

- f0d850c: Show a real-time log of what `otheme set` is doing

  `otheme set` previously printed only a single `applied <theme>` line. It now renders a live, plan-driven log grouped by target: each file write (`+`) and command (`$`) is shown at the moment it runs, with a spinner that resolves in place to its final state (or a `✗` plus stderr excerpt on failure), ending with a `✓ applied <theme> · N targets · <time>` summary. A failing target no longer aborts the run — it prints a clean error line, continues to the remaining targets, and the summary reports `⚠ applied <theme> with N errors`.

  `otheme set --dry-run` now drives the same code path as a real apply, with mutating operations stubbed out (no files written, no state changes, no reload commands run) while read-only discovery still executes. This means the dry-run preview reflects exactly what a real apply would do, instead of a separately computed plan that could drift from it.

- 58551fd: Add an `--only [target]` flag to `otheme set` to restrict the apply to specific targets

  `otheme set <theme> --only tmux --only nvim` applies the theme only to the listed targets. The flag is repeatable and validated against the known target ids, so typos are rejected at parse time. Requesting a valid-but-disabled target fails with a clear error instead of silently doing nothing.

- 93d3119: Add a `yazi` target

  New `yazi` target that authors `~/.config/yazi/theme.toml` from each theme's shared UI palette. It writes yazi's current `[mgr]`-era theme sections as inline TOML style tables and lets yazi defaults apply for symbols and separators that otheme does not set.

  The built-in themes now include `yazi`, so enabling that target in `~/.config/otheme/config.json` gives yazi a palette-matched file manager theme without patching any other yazi config files. otheme owns `~/.config/yazi/theme.toml` entirely and rewrites it on each run.

### Patch Changes

- b84084e: Author ghostty theme for the claude palette instead of mapping to the built-in preset

  The claude theme's ghostty target now uses `author` mode, generating the full Ghostty theme from the palette's own tokens (background, foreground, cursor, selection, ANSI palette) instead of pointing at Ghostty's bundled "Claude" theme. This makes the terminal background match the rest of the theme (`#F8F8F6`).

- 8e3699e: Fix tmux command prompt not spanning full width on tmux 3.7

  tmux 3.7 changed messages and the command prompt to overlay only as wide as their text instead of replacing the whole status line. The width is now controlled by a `fill` directive that only takes effect inside `message-format` — `fill` placed in `message-style`/`message-command-style` is ignored once expanded via `#{E:...}`. The tmux target now sets `message-format` with an explicit `#[fill=...]` directive and aligns `message-command-style` with `message-style` so the prompt text stays readable on the filled bar.

## 0.1.0

### Minor Changes

- 11636b6: Initial release of otheme v1.

  Define a theme once as a standardized JSON and apply it consistently across all your tools. Supported targets: nvim, tmux, ghostty, claude-code.

  Features:

  - `otheme set <theme>` — apply a theme to all supported targets
  - `otheme set <theme> --dry-run` — preview planned file writes and commands without applying
  - `otheme alias` — list configured aliases
  - `otheme alias set <dark|light> <theme>` — map an alias to a theme
  - Bundled themes: vesper, atom-one-light, claude
  - Alias state persisted to `~/.config/otheme/config.json`
