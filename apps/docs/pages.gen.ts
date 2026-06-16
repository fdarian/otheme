// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router'

// prettier-ignore
type Page =
  | { path: '/getting-started/installation'; render: 'static' }
  | { path: '/getting-started/usage'; render: 'static' }
  | { path: '/'; render: 'static' }
  | { path: '/playground'; render: 'static' }
  | { path: '/targets/claude-code'; render: 'static' }
  | { path: '/targets/ghostty'; render: 'static' }
  | { path: '/targets/git-delta'; render: 'static' }
  | { path: '/targets/macos'; render: 'static' }
  | { path: '/targets/nvim'; render: 'static' }
  | { path: '/targets/tmux'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
