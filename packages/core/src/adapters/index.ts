import { nvimAdapter } from './nvim-adapter.ts';
import { tmuxAdapter } from './tmux-adapter.ts';

export const m1Adapters = [nvimAdapter, tmuxAdapter] as const;

export { nvimAdapter, tmuxAdapter };
