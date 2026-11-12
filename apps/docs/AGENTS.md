# otheme Docs

End-user documentation site for otheme.

## Stack
- Blume (with `@fdarian/blume-preset`)
- MDX
- Bun

## Dev
- `bun run dev`
- `bun run build`
- `bun run check:type`
- `bun run check:lint`

## Architecture
- `docs/` - Blume content root. Sidebar order comes from the file tree plus `meta.ts` per folder.
- `blume.config.ts`, `components.ts`, `theme.css` - the three files that wire up the preset.
- `scripts/generate-target-pages.ts` - generates `docs/targets/*.mdx` from adapter `plan()` output.

## Generated target pages — do not hand-edit
Every `docs/targets/*.mdx` is overwritten by `bun run generate` (runs before `dev` and `build`). To change one, edit the generator, then run `bun run generate` and commit both.
- Per-target prose lives in that target's `TargetPageConfig` entry (`intro`, `compatibility`, `setupSection`, `midSections`).
- The Files/Commands tables come from the adapter's `plan()` in `packages/core/src/adapters/<target>-adapter.ts`.
- A new target also needs its slug added to `docs/targets/meta.ts`.
