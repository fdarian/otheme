import { Config, Effect, FileSystem, Path } from 'effect';
import { CommandExecutor, formatCommand } from '../command-executor.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  batConfigRelPath,
  batThemeName,
  batThemeRelPath,
  renderBatTheme,
  updateBatConfig,
} from './bat-renderer.ts';
import {
  getBatTarget,
  missingTargetPlan,
  requireBatTarget,
} from './target-selectors.ts';

export const batAdapter: TargetAdapter = {
  id: 'bat',
  plan: (theme: Theme) => {
    const target = getBatTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'bat');
    }

    return {
      commands: [
        {
          cmd: formatCommand('bat', ['cache', '--build']),
          why: 'rebuild the bat theme cache so the generated theme becomes available',
        },
      ],
      creates: [
        {
          path: `~/${batThemeRelPath(theme)}`,
          summary: `write generated bat theme ${batThemeName(theme)}.tmTheme from the palette`,
        },
        {
          path: `~/${batConfigRelPath}`,
          summary: `set --theme="${batThemeName(theme)}"`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      yield* requireBatTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const executor = yield* CommandExecutor;
      const home = yield* Config.string('HOME');

      const themePath = path.join(home, batThemeRelPath(theme));
      const configPath = path.join(home, batConfigRelPath);

      yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
      yield* fs.writeFileString(themePath, renderBatTheme(theme));

      const configExists = yield* fs.exists(configPath);
      const configContent = configExists
        ? yield* fs.readFileString(configPath)
        : '';

      yield* fs.makeDirectory(path.dirname(configPath), { recursive: true });
      yield* fs.writeFileString(
        configPath,
        updateBatConfig(configContent, theme),
      );

      yield* executor.run('bat', ['cache', '--build']);
    }),
};
