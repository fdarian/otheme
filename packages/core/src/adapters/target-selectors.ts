import { Effect } from 'effect';
import { TargetNotFoundError } from '../errors.ts';
import type { AdapterPlan } from '../target-adapter.ts';
import type { NvimTarget, Theme, TmuxTarget } from '../theme-schema.ts';

export const getNvimTarget = (theme: Theme): NvimTarget | undefined => {
  for (const target of theme.targets) {
    if (target.id === 'nvim') {
      return target;
    }
  }

  return undefined;
};

export const getTmuxTarget = (theme: Theme): TmuxTarget | undefined => {
  for (const target of theme.targets) {
    if (target.id === 'tmux') {
      return target;
    }
  }

  return undefined;
};

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
