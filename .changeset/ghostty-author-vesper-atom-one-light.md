---
"otheme": patch
---

Author ghostty theme for the vesper and atom-one-light palettes instead of mapping to built-in presets

The vesper and atom-one-light themes' ghostty targets now use `author` mode, generating the full Ghostty theme from each palette's own tokens (background, foreground, cursor, selection, ANSI palette) instead of pointing at Ghostty's bundled "Vesper" and "Atom One Light" presets. This makes the terminal match the rest of the theme and gives the cursor `ui.accent`, matching what the claude theme already does.
