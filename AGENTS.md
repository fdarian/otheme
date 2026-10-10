# otheme

Monorepo for the otheme CLI and theme adapter packages.

## Workspaces
- `packages/config` - shared TypeScript configs.
- `packages/core` - theme spec, registry, alias store, and target adapters.
- `apps/cli` - user-facing `otheme` command.
- `apps/docs` - end-user Vocs documentation site.

## Stack
- pnpm for package manager (use `pnpm install`)
- bun for runtime (use `bun run path-to-script`)
