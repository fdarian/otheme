---
"otheme": patch
---

Author ghostty theme for the claude palette instead of mapping to the built-in preset

The claude theme's ghostty target now uses `author` mode, generating the full Ghostty theme from the palette's own tokens (background, foreground, cursor, selection, ANSI palette) instead of pointing at Ghostty's bundled "Claude" theme. This makes the terminal background match the rest of the theme (`#F8F8F6`).
