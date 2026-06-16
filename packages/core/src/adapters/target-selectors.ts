import { Effect } from 'effect';
import { TargetNotFoundError } from '../errors.ts';
import type { AdapterPlan } from '../target-adapter.ts';
import type {
  ClaudeCodeTarget,
  GhosttyTarget,
  NvimTarget,
  Theme,
  TmuxTarget,
} from '../theme-schema.ts';

export const getNvimTarget = (theme: Theme): NvimTarget | undefined =>
  theme.targets.nvim;

export const getTmuxTarget = (theme: Theme): TmuxTarget | undefined =>
  theme.targets.tmux;

export const getGhosttyTarget = (theme: Theme): GhosttyTarget | undefined =>
  theme.targets.ghostty;

export const getClaudeCodeTarget = (
  theme: Theme,
): ClaudeCodeTarget | undefined => theme.targets['claude-code'];

export const requireNvimTarget = (theme: Theme) => {
  const target = getNvimTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'nvim', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireTmuxTarget = (theme: Theme) => {
  const target = getTmuxTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'tmux', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireGhosttyTarget = (theme: Theme) => {
  const target = getGhosttyTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'ghostty', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireClaudeCodeTarget = (theme: Theme) => {
  const target = getClaudeCodeTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'claude-code', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const missingTargetPlan = (
  theme: Theme,
  targetId: string,
): AdapterPlan => ({
  commands: [
    {
      cmd: `otheme cannot apply missing ${targetId} target`,
      why: `Theme ${theme.id} does not define a ${targetId} target`,
    },
  ],
  creates: [],
});
