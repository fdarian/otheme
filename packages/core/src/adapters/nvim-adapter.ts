import { Config, Effect, FileSystem, Path } from 'effect';
import { CommandExecutor, formatCommand } from '../command-executor.ts';
import { AdapterError } from '../errors.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import { renderNvim } from './nvim-renderer.ts';
import {
  getNvimTarget,
  missingTargetPlan,
  requireNvimTarget,
} from './target-selectors.ts';

const generatedNvimLuaPath = (home: string, path: Path.Path): string =>
  path.join(home, '.config', 'otheme', 'generated', 'nvim.lua');

const nvimInitLuaPath = (home: string, path: Path.Path): string =>
  path.join(home, '.config', 'nvim', 'init.lua');

const nvimInitVimPath = (home: string, path: Path.Path): string =>
  path.join(home, '.config', 'nvim', 'init.vim');

const OTHEME_BLOCK_START_PREFIX = '-- >>> otheme:';
const OTHEME_BLOCK_END = '-- <<< otheme <<<';

const othemeInitLuaBlock = (generatedPath: string): string =>
  `-- >>> otheme: auto-generated — do NOT edit this block. otheme locates and >>>
-- >>> replaces it by matching these markers; manual edits are overwritten. >>>
pcall(dofile, vim.fn.expand("${generatedPath}"))
-- <<< otheme <<<`;

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

const nvimLiveApplyCommand = (generatedPath: string): string =>
  formatCommand('nvim', [
    '--server',
    '<socket>',
    '--remote-expr',
    `execute("luafile ${generatedPath}")`,
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

/**
 * Patches ~/.config/nvim/init.lua with the otheme block idempotently.
 * If no init.lua exists, creates it. Throws if init.vim exists but init.lua
 * does not — we only support init.lua.
 */
const patchNvimInitLua = (home: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const initLuaPath = nvimInitLuaPath(home, path);
    const initVimPath = nvimInitVimPath(home, path);
    const genPath = generatedNvimLuaPath(home, path);
    const block = othemeInitLuaBlock(genPath);

    const initLuaExists = yield* fs.exists(initLuaPath);
    const initVimExists = yield* fs.exists(initVimPath);

    if (!initLuaExists && initVimExists) {
      return yield* Effect.fail(
        new AdapterError({
          adapterId: 'nvim',
          message: [
            `otheme only supports init.lua, but found init.vim at ${initVimPath}.`,
            `Either migrate to init.lua or manually add the following block to your config:`,
            ``,
            block,
          ].join('\n'),
        }),
      );
    }

    if (!initLuaExists) {
      yield* fs.makeDirectory(path.dirname(initLuaPath), { recursive: true });
      yield* fs.writeFileString(initLuaPath, `${block}\n`);
      return;
    }

    const content = yield* fs.readFileString(initLuaPath);
    const lines = content.split('\n');

    const startIndex = lines.findIndex((line) =>
      line.startsWith(OTHEME_BLOCK_START_PREFIX),
    );

    if (startIndex !== -1) {
      const endIndex = lines.findIndex(
        (line, i) => i >= startIndex && line === OTHEME_BLOCK_END,
      );

      if (endIndex === -1) {
        return yield* Effect.fail(
          new AdapterError({
            adapterId: 'nvim',
            message: `Found otheme block start marker in ${initLuaPath} but no end marker. Please remove the partial block manually.`,
          }),
        );
      }

      const before = lines.slice(0, startIndex);
      const after = lines.slice(endIndex + 1);
      const patched = [...before, ...block.split('\n'), ...after].join('\n');
      yield* fs.writeFileString(initLuaPath, patched);
      return;
    }

    // No existing block — append at end of file
    const separator = content.endsWith('\n') ? '' : '\n';
    yield* fs.writeFileString(initLuaPath, `${content}${separator}${block}\n`);
  });

export const nvimAdapter: TargetAdapter = {
  id: 'nvim',
  plan: (theme: Theme) => {
    const target = getNvimTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'nvim');
    }

    // Use a placeholder home for plan display
    const genPath = '~/.config/otheme/generated/nvim.lua';

    return {
      commands: [
        {
          cmd: nvimDiscoverRunDirCommand(),
          why: 'discover Neovim runtime directory for live sockets',
        },
        {
          cmd: nvimLiveApplyCommand(genPath),
          why: 'live-apply the generated colorscheme to each running Neovim socket',
        },
      ],
      creates: [
        {
          path: genPath,
          summary: `write generated Neovim colorscheme for ${theme.name}`,
        },
        {
          path: '~/.config/nvim/init.lua',
          summary: 'patch init.lua with otheme auto-source block (idempotent)',
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
      const genPath = generatedNvimLuaPath(home, path);
      const rendered = renderNvim(theme, target);

      yield* fs.makeDirectory(path.dirname(genPath), { recursive: true });
      yield* fs.writeFileString(genPath, rendered);

      yield* patchNvimInitLua(home);

      const sockets = yield* discoverNvimSockets;

      for (const socket of sockets) {
        yield* executor.run('nvim', [
          '--server',
          socket,
          '--remote-expr',
          `execute("luafile ${genPath}")`,
        ]);
      }
    }),
};
