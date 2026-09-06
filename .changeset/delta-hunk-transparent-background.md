---
"@otheme/core": patch
---

Stop painting opaque backgrounds behind unchanged diff lines in the `git-delta` and `hunk` targets

`git-delta`'s `zero-style` now emits `syntax normal` instead of baking in the theme's canvas color, so context lines fall back to the terminal background like delta's own default. `hunk`'s generated `config.toml` now sets top-level `transparent_background = true`, since hunk's config has no per-token "unset" and would otherwise fall back to its built-in base theme's hardcoded background; this swaps the six neutral surface tokens to a transparent sentinel while leaving diff add/remove colors themed.
