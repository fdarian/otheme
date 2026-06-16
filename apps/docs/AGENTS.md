# otheme Docs

End-user documentation site for otheme.

## Stack
- Vocs
- MDX
- Bun

## Dev
- `bun run dev`
- `bun run build`
- `bun run check:type`
- `bun run check:lint`

## Architecture
- `pages/` - Vocs pages.
- `scripts/generate-target-pages.ts` - generates target transparency pages from adapter `plan()` output.
- `src/generated/` - generated target page metadata used by the Vocs sidebar.
