import { batAdapter } from './bat-adapter.ts';
import { claudeCodeAdapter } from './claude-code-adapter.ts';
import { ghosttyAdapter } from './ghostty-adapter.ts';
import { gitDeltaAdapter } from './git-delta-adapter.ts';
import { macosAdapter } from './macos-adapter.ts';
import { nvimAdapter } from './nvim-adapter.ts';
import { tmuxAdapter } from './tmux-adapter.ts';

export const m1Adapters = [nvimAdapter, tmuxAdapter] as const;
export const targetAdapters = [
  ...m1Adapters,
  ghosttyAdapter,
  claudeCodeAdapter,
  gitDeltaAdapter,
  batAdapter,
  macosAdapter,
] as const;

export {
  batAdapter,
  claudeCodeAdapter,
  ghosttyAdapter,
  gitDeltaAdapter,
  macosAdapter,
  nvimAdapter,
  tmuxAdapter,
};
