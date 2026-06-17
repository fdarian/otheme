---
"otheme": minor
---

Add a `bat` target and derive git-delta's syntax theme from the palette

New `bat` target that authors a real syntax theme from each theme's palette. It generates `~/.config/bat/themes/otheme-<theme-id>.tmTheme` (mapping the shared syntax tokens to TextMate scopes, the same semantic mapping the nvim target uses), points bat's config at it via `--theme`, and runs `bat cache --build` so the theme becomes available.

The `git-delta` target is now a consumer of that theme. git-delta has no syntax engine — it delegates syntax highlighting to bat — so its generated `~/.config/git/otheme-delta.conf` now sets `syntax-theme = otheme-<theme-id>`, making diff token colors match the active theme instead of inheriting an unrelated third-party preset. All existing diff chrome (minus/plus/zero styles, emphasis, line-number colors, gitconfig include wiring) is unchanged.

The two targets are decoupled — enabling git-delta does not enable bat automatically. When you enable `git-delta`, enable `bat` as well so the referenced syntax theme exists; otherwise delta falls back to its default highlighting for code tokens inside diffs.
