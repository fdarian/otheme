import { Effect } from 'effect';
import { CommandExecutor, formatCommand } from '../command-executor.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  getMacosTarget,
  missingTargetPlan,
  requireMacosTarget,
} from './target-selectors.ts';

const makeOsascriptArgs = (darkMode: boolean): ReadonlyArray<string> => [
  '-e',
  `tell application "System Events" to tell appearance preferences to set dark mode to ${darkMode}`,
];

const osascriptCommand = (darkMode: boolean): string =>
  formatCommand('osascript', makeOsascriptArgs(darkMode));

export const macosAdapter: TargetAdapter = {
  id: 'macos',
  plan: (theme: Theme) => {
    const target = getMacosTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'macos');
    }

    const darkMode = theme.appearance === 'dark';

    return {
      commands: [
        {
          cmd: osascriptCommand(darkMode),
          why: `set macOS system appearance to ${theme.appearance} to match the theme`,
        },
      ],
      creates: [],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      yield* requireMacosTarget(theme);
      const executor = yield* CommandExecutor;
      const darkMode = theme.appearance === 'dark';

      yield* executor.run('osascript', makeOsascriptArgs(darkMode));
    }),
};
