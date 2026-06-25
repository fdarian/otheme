import { Effect } from 'effect';
import { TargetNotFoundError } from '../errors.ts';
import type { AdapterPlan } from '../target-adapter.ts';
import type {
  BatTarget,
  ClaudeCodeTarget,
  GhosttyTarget,
  GitDeltaTarget,
  MacosTarget,
  NvimTarget,
  OpencodeTarget,
  Theme,
  TmuxTarget,
  YaziTarget,
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

export const getGitDeltaTarget = (theme: Theme): GitDeltaTarget | undefined =>
  theme.targets['git-delta'];

export const getBatTarget = (theme: Theme): BatTarget | undefined =>
  theme.targets.bat;

export const getMacosTarget = (theme: Theme): MacosTarget | undefined =>
  theme.targets.macos;

export const getYaziTarget = (theme: Theme): YaziTarget | undefined =>
  theme.targets.yazi;

export const getOpencodeTarget = (theme: Theme): OpencodeTarget | undefined =>
  theme.targets.opencode;

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

export const requireGitDeltaTarget = (theme: Theme) => {
  const target = getGitDeltaTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'git-delta', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireBatTarget = (theme: Theme) => {
  const target = getBatTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'bat', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireMacosTarget = (theme: Theme) => {
  const target = getMacosTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'macos', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireYaziTarget = (theme: Theme) => {
  const target = getYaziTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'yazi', themeId: theme.id }),
    );
  }

  return Effect.succeed(target);
};

export const requireOpencodeTarget = (theme: Theme) => {
  const target = getOpencodeTarget(theme);

  if (target === undefined) {
    return Effect.fail(
      new TargetNotFoundError({ targetId: 'opencode', themeId: theme.id }),
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
