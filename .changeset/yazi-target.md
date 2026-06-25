---
"otheme": minor
---

Add a `yazi` target

New `yazi` target that authors `~/.config/yazi/theme.toml` from each theme's shared UI palette. It writes yazi's current `[mgr]`-era theme sections as inline TOML style tables and lets yazi defaults apply for symbols and separators that otheme does not set.

The built-in themes now include `yazi`, so enabling that target in `~/.config/otheme/config.json` gives yazi a palette-matched file manager theme without patching any other yazi config files. otheme owns `~/.config/yazi/theme.toml` entirely and rewrites it on each run.
