# @otheme/playground

Internal web app hosting the otheme theme playground — interactive preview and customization of themes across targets.

## Stack
- TanStack Start (file-based routing, SSR)
- shadcn new-york / zinc + Tailwind v4 + Geist font
- React 19 + Vite 8 (bun runtime)

## Dev
- `bun dev` — start dev server on port 3001
- `bun run check:type` — TypeScript type check
- `bun run check:lint` — Biome lint

## Architecture
- `src/routes/` — file-based routes (TanStack Start)
- `src/routes/__root.tsx` — HTML shell, font loading, global CSS
- `src/components/ui/` — shadcn components
- `src/lib/utils.ts` — `cn()` helper
- `src/globals.css` — Tailwind v4 theme vars (zinc/oklch)

## Rules
- Path alias `#/*` maps to `src/*` — use this everywhere, never `@/*`
- No `'use client'` anywhere — TanStack Start has no RSC directive
- Server functions go in dedicated `*.functions.ts` files, never mixed into components
- Kebab-case filenames for all source files
