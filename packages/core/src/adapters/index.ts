import { agentDashAdapter } from './agent-dash-adapter.ts';
import { batAdapter } from './bat-adapter.ts';
import { claudeCodeAdapter } from './claude-code-adapter.ts';
import { ghosttyAdapter } from './ghostty-adapter.ts';
import { gitDeltaAdapter } from './git-delta-adapter.ts';
import { hunkAdapter } from './hunk-adapter.ts';
import { macosAdapter } from './macos-adapter.ts';
import { nvimAdapter } from './nvim-adapter.ts';
import { opencodeAdapter } from './opencode-adapter.ts';
import { tmuxAdapter } from './tmux-adapter.ts';
import { tmuxPaletteAdapter } from './tmux-palette-adapter.ts';
import { yaziAdapter } from './yazi-adapter.ts';

export const m1Adapters = [nvimAdapter, tmuxAdapter] as const;
export const targetAdapters = [
  ...m1Adapters,
  tmuxPaletteAdapter,
  ghosttyAdapter,
  claudeCodeAdapter,
  gitDeltaAdapter,
  hunkAdapter,
  batAdapter,
  yaziAdapter,
  opencodeAdapter,
  macosAdapter,
  agentDashAdapter,
] as const;

export {
  agentDashAdapter,
  batAdapter,
  claudeCodeAdapter,
  ghosttyAdapter,
  gitDeltaAdapter,
  hunkAdapter,
  macosAdapter,
  nvimAdapter,
  opencodeAdapter,
  tmuxAdapter,
  tmuxPaletteAdapter,
  yaziAdapter,
};
