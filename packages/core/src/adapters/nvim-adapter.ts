import { Config, Effect, FileSystem, Path } from 'effect';
import { CommandExecutor, formatCommand } from '../command-executor.ts';
import { AdapterError } from '../errors.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { NvimTarget, Theme } from '../theme-schema.ts';
import { renderNvim } from './nvim-renderer.ts';
import {
  getNvimTarget,
  missingTargetPlan,
  requireNvimTarget,
} from './target-selectors.ts';

const nvimColorsPathFor = (target: NvimTarget): string =>
  `~/.local/share/nvim/site/colors/${target.colorscheme}.lua`;

/**
 * Uses writefile to /dev/stdout because nvim's :echo in --headless -es mode
 * does not produce output — the silent ex flag suppresses it entirely.
 */
const nvimDiscoverRunDirCommand = (): string =>
  formatCommand('nvim', [
    '--headless',
    "+call writefile([stdpath('run')], '/dev/stdout')",
    '+q',
  ]);

const nvimLiveApplyCommand = (target: NvimTarget): string =>
  formatCommand('nvim', [
    '--server',
    '<socket>',
    '--remote-expr',
    `execute("colorscheme ${target.colorscheme}")`,
  ]);

const parseNvimRunDir = (output: string) =>
  Effect.gen(function* () {
    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const runDir = lines[lines.length - 1];

    if (runDir === undefined) {
      return yield* Effect.fail(
        new AdapterError({
          adapterId: 'nvim',
          message: 'nvim did not print stdpath("run")',
        }),
      );
    }

    return runDir;
  });

/**
 * stdpath('run') is unique per nvim process, so the helper invocation returns
 * its own temporary dir.  All running instances share the same *parent* dir
 * (e.g. /tmp/nvim.user/), so we enumerate sockets one level up.
 */
const discoverNvimSockets = Effect.gen(function* () {
  const executor = yield* CommandExecutor;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const output = yield* executor.read('nvim', [
    '--headless',
    "+call writefile([stdpath('run')], '/dev/stdout')",
    '+q',
  ]);
  const instanceRunDir = yield* parseNvimRunDir(output);
  const socketsBaseDir = path.dirname(instanceRunDir);

  const baseExists = yield* fs.exists(socketsBaseDir);

  if (!baseExists) {
    return [];
  }

  const entries = yield* fs.readDirectory(socketsBaseDir, { recursive: true });
  const sockets: Array<string> = [];

  for (const entry of entries) {
    const entryPath = path.join(socketsBaseDir, entry);
    const info = yield* fs.stat(entryPath);

    if (info.type === 'Socket') {
      sockets.push(entryPath);
    }
  }

  return sockets;
});

export const nvimAdapter: TargetAdapter = {
  id: 'nvim',
  plan: (theme: Theme) => {
    const target = getNvimTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'nvim');
    }

    return {
      commands: [
        {
          cmd: nvimDiscoverRunDirCommand(),
          why: 'discover Neovim runtime directory for live sockets',
        },
        {
          cmd: nvimLiveApplyCommand(target),
          why: 'live-apply the colorscheme to each running Neovim socket',
        },
      ],
      creates: [
        {
          path: nvimColorsPathFor(target),
          summary: `write generated Neovim colorscheme for ${theme.name}`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requireNvimTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const executor = yield* CommandExecutor;
      const home = yield* Config.string('HOME');
      const colorsPath = path.join(
        home,
        '.local',
        'share',
        'nvim',
        'site',
        'colors',
        `${target.colorscheme}.lua`,
      );
      const rendered = renderNvim(theme, target);

      yield* fs.makeDirectory(path.dirname(colorsPath), { recursive: true });
      yield* fs.writeFileString(colorsPath, rendered);

      const sockets = yield* discoverNvimSockets;

      for (const socket of sockets) {
        yield* executor.run('nvim', [
          '--server',
          socket,
          '--remote-expr',
          `execute("colorscheme ${target.colorscheme}")`,
        ]);
      }
    }),
};
