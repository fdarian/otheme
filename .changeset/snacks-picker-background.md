---
"otheme": patch
---

Fix snacks.nvim picker showing a greyed background instead of the normal editor background

snacks.nvim's picker windows (input, list, preview) all link transitively to a single `SnacksPicker` highlight group, which defaults to `NormalFloat`. Since `NormalFloat` uses the theme's floating background color, the picker looked slightly greyed compared to telescope and fff, which use the normal editor background. The nvim target now defines `SnacksPicker` explicitly with the same background as `Normal`.
