import { Config, Console, Effect, FileSystem, Path } from 'effect';
import { CommandExecutor, formatCommand } from '../command-executor.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  ghosttyManagedLines,
  ghosttyThemeName,
  renderGhosttyTheme,
  updateGhosttyConfig,
} from './ghostty-renderer.ts';
import {
  getGhosttyTarget,
  missingTargetPlan,
  requireGhosttyTarget,
} from './target-selectors.ts';

const ghosttyConfigPath = '~/.config/ghostty/config';

const ghosttyThemePathFor = (theme: Theme): string =>
  `~/.config/ghostty/themes/${ghosttyThemeName(theme)}`;

const reloadGhostty = Effect.gen(function* () {
  const executor = yield* CommandExecutor;
  const output = yield* executor.read('ps', ['-axo', 'pid=,comm=']);
  const pids: Array<string> = [];

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const match = trimmed.match(/^(\d+)\s+(.+)$/);

    if (match === null) {
      continue;
    }

    const pid = match[1];
    const command = match[2];

    if (
      pid !== undefined &&
      command !== undefined &&
      /(^|\/)ghostty$/i.test(command)
    ) {
      pids.push(pid);
    }
  }

  if (pids.length === 0) {
    yield* Console.warn('Could not find a running Ghostty process to reload');
    return;
  }

  for (const pid of pids) {
    yield* executor.run('kill', ['-USR2', pid]);
  }
});

export const ghosttyAdapter: TargetAdapter = {
  id: 'ghostty',
  plan: (theme: Theme) => {
    const target = getGhosttyTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'ghostty');
    }

    const creates = [];
    const managedLines = ghosttyManagedLines(theme, target);

    if (target.mode === 'author') {
      creates.push({
        path: ghosttyThemePathFor(theme),
        summary: `write generated Ghostty theme ${ghosttyThemeName(theme)}`,
      });
    }

    for (const line of managedLines) {
      creates.push({
        path: ghosttyConfigPath,
        summary: `set ${line.property} = ${line.value}`,
      });
    }

    return {
      commands: [
        {
          cmd: formatCommand('ps', ['-axo', 'pid=,comm=']),
          why: 'find running Ghostty processes without requiring jc',
        },
        {
          cmd: formatCommand('kill', ['-USR2', '<ghostty-pid>']),
          why: 'reload each running Ghostty process after config changes',
        },
      ],
      creates,
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requireGhosttyTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');
      const configPath = path.join(home, '.config', 'ghostty', 'config');
      const configExists = yield* fs.exists(configPath);
      const configContent = configExists
        ? yield* fs.readFileString(configPath)
        : '';
      const nextConfig = updateGhosttyConfig(
        configContent,
        ghosttyManagedLines(theme, target),
      );

      if (target.mode === 'author') {
        const themePath = path.join(
          home,
          '.config',
          'ghostty',
          'themes',
          ghosttyThemeName(theme),
        );

        yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
        yield* fs.writeFileString(themePath, renderGhosttyTheme(theme, target));
      }

      yield* fs.makeDirectory(path.dirname(configPath), { recursive: true });
      yield* fs.writeFileString(configPath, nextConfig);
      yield* reloadGhostty;
    }),
};
