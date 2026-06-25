#!/usr/bin/env node

import { NodeRuntime, NodeServices } from '@effect/platform-node';
import {
  AliasStore,
  type CommandExecutionError,
  CommandExecutor,
  ConfigStore,
  formatCommand,
  isThemeId,
  loadTheme,
  type OthemeConfig,
  type PartialTargets,
  StateStore,
  type TargetAdapter,
  type Theme,
  targetAdapters,
} from '@otheme/core';
import {
  Config,
  Console,
  Effect,
  FileSystem,
  Layer,
  type PlatformError,
  Result,
} from 'effect';
import { Argument, Command, Flag } from 'effect/unstable/cli';
import packageJson from '../package.json';
import {
  collapseHomePath,
  printSetApplyStart,
  printSetResult,
  printSetTargetFailure,
  printSetTargetStart,
  renderSetCommandLine,
  renderSetCreateLine,
  runSetSpinner,
} from './set-log.ts';

const themeArg = Argument.string('theme-or-alias').pipe(
  Argument.withDescription('Theme id or configured alias'),
);

const dryRunFlag = Flag.boolean('dry-run').pipe(
  Flag.withDefault(false),
  Flag.withDescription(
    'Print planned file writes and commands without applying',
  ),
);

const aliasArg = Argument.choice('alias', ['dark', 'light']).pipe(
  Argument.withDescription('Alias to update'),
);

const aliasThemeArg = Argument.string('theme').pipe(
  Argument.withDescription('Theme id to assign to the alias'),
);

const resolveThemeId = (value: string) =>
  Effect.gen(function* () {
    if (isThemeId(value)) {
      return value;
    }

    const aliasStore = yield* AliasStore;

    return yield* aliasStore.resolve(value);
  });

const loadThemeOrAlias = (value: string) =>
  Effect.gen(function* () {
    const themeId = yield* resolveThemeId(value);

    return yield* loadTheme(themeId);
  });

const getEnabledAdapters = (config: OthemeConfig) => {
  const targets = config.targets;

  if (targets === undefined) {
    return [];
  }

  return targetAdapters.filter((adapter) => targets[adapter.id] === true);
};

const noTargetsNotice = Effect.gen(function* () {
  const ids = targetAdapters.map((adapter) => adapter.id).join(', ');

  yield* Console.log(
    'No targets are enabled. Run `otheme config` to initialize your config,',
  );
  yield* Console.log(`then set targets to enable them: ${ids}`);
});

const mergeClaudeCodeTarget = (
  target: Theme['targets']['claude-code'],
  override: PartialTargets['claude-code'],
): Theme['targets']['claude-code'] => {
  if (target === undefined || override === undefined) {
    return target;
  }

  const mode = override.mode !== undefined ? override.mode : target.mode;

  if (mode === 'author') {
    return { mode: 'author' };
  }

  const mapTo =
    override.mapTo !== undefined
      ? override.mapTo
      : target.mode === 'map'
        ? target.mapTo
        : undefined;

  if (mapTo === undefined) {
    throw new Error('Claude Code target override requires mapTo in map mode');
  }

  return { mapTo, mode: 'map' };
};

const mergeOpencodeTarget = (
  target: Theme['targets']['opencode'],
  override: PartialTargets['opencode'],
): Theme['targets']['opencode'] => {
  if (target === undefined || override === undefined) {
    return target;
  }

  const overrides =
    target.overrides !== undefined && override.overrides !== undefined
      ? Object.assign({}, target.overrides, override.overrides)
      : override.overrides !== undefined
        ? override.overrides
        : target.overrides;

  if (overrides === undefined) {
    return {};
  }

  return { overrides };
};

const mergeTargetOverride = (
  targets: Theme['targets'],
  override: PartialTargets | undefined,
): Theme['targets'] => {
  if (override === undefined) {
    return targets;
  }

  return {
    bat:
      targets.bat !== undefined && override.bat !== undefined
        ? { ...targets.bat, ...override.bat }
        : targets.bat,
    'claude-code': mergeClaudeCodeTarget(
      targets['claude-code'],
      override['claude-code'],
    ),
    'git-delta':
      targets['git-delta'] !== undefined && override['git-delta'] !== undefined
        ? { ...targets['git-delta'], ...override['git-delta'] }
        : targets['git-delta'],
    ghostty:
      override.ghostty !== undefined ? override.ghostty : targets.ghostty,
    macos:
      targets.macos !== undefined && override.macos !== undefined
        ? { ...targets.macos, ...override.macos }
        : targets.macos,
    nvim:
      targets.nvim !== undefined && override.nvim !== undefined
        ? { ...targets.nvim, ...override.nvim }
        : targets.nvim,
    opencode: mergeOpencodeTarget(targets.opencode, override.opencode),
    tmux:
      targets.tmux !== undefined && override.tmux !== undefined
        ? { ...targets.tmux, ...override.tmux }
        : targets.tmux,
    yazi:
      targets.yazi !== undefined && override.yazi !== undefined
        ? { ...targets.yazi, ...override.yazi }
        : targets.yazi,
  };
};

const withOverrides = (theme: Theme, config: OthemeConfig): Theme => {
  const override =
    config.overrides !== undefined ? config.overrides[theme.id] : undefined;
  return {
    ...theme,
    targets: mergeTargetOverride(theme.targets, override),
  };
};

type PreparedSetTheme = {
  readonly enabledAdapters: ReadonlyArray<TargetAdapter>;
  readonly theme: Theme;
};

const prepareSetTheme = (themeValue: string, config: OthemeConfig) =>
  Effect.gen(function* () {
    const rawTheme = yield* loadThemeOrAlias(themeValue);
    const theme = withOverrides(rawTheme, config);
    const enabledAdapters = getEnabledAdapters(config);

    return {
      enabledAdapters,
      theme,
    };
  });

const readHomePath = Effect.gen(function* () {
  const homeResult = yield* Effect.result(Config.string('HOME'));

  if (Result.isSuccess(homeResult)) {
    return homeResult.success;
  }

  return undefined;
});

const operationFailureDetails = (error: unknown): string | undefined => {
  if (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    error._tag === 'CommandExecutionError' &&
    'stderr' in error
  ) {
    const stderr = error.stderr;

    if (typeof stderr === 'string') {
      return stderr;
    }

    return undefined;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
};

type TargetFailureDisplay = {
  readonly detail: string | undefined;
  readonly reason: string;
};

const collapseHomePathText = (
  text: string,
  homePath: string | undefined,
): string => {
  if (homePath === undefined) {
    return text;
  }

  return text.replaceAll(homePath, '~');
};

const targetFailureDisplay = (
  error: unknown,
  homePath: string | undefined,
): TargetFailureDisplay => {
  const detailText = collapseHomePathText(
    operationFailureDetails(error) ?? String(error),
    homePath,
  );
  const detailLines = detailText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (detailLines.length === 0) {
    return {
      detail: undefined,
      reason: String(error),
    };
  }

  const reason = detailLines[0];

  if (reason === undefined) {
    return {
      detail: undefined,
      reason: String(error),
    };
  }

  const detail =
    detailLines.length > 1 ? detailLines.slice(1).join('\n') : undefined;

  return {
    detail,
    reason,
  };
};

const runSet = (preparedTheme: PreparedSetTheme, dryRun: boolean) =>
  Effect.gen(function* () {
    const enabledAdapters = preparedTheme.enabledAdapters;

    if (enabledAdapters.length === 0) {
      yield* noTargetsNotice;
      return;
    }

    const homePath = yield* readHomePath;
    const executor = yield* CommandExecutor;
    const fileSystem = yield* FileSystem.FileSystem;
    const startedAt = dryRun ? undefined : Date.now();
    const targetCount = enabledAdapters.length;
    let errorCount = 0;

    yield* printSetApplyStart(preparedTheme.theme.id, targetCount, dryRun);

    for (const adapter of enabledAdapters) {
      let operationFailed = false;

      yield* printSetTargetStart(adapter.id);

      const loggingExecutor: {
        readonly read: (
          command: string,
          args: ReadonlyArray<string>,
        ) => Effect.Effect<
          string,
          CommandExecutionError | PlatformError.PlatformError
        >;
        readonly run: (
          command: string,
          args: ReadonlyArray<string>,
        ) => Effect.Effect<
          void,
          CommandExecutionError | PlatformError.PlatformError
        >;
      } = {
        read: (command: string, args: ReadonlyArray<string>) => {
          const formattedCommand = formatCommand(command, args);

          return runSetSpinner(
            formattedCommand,
            renderSetCommandLine(formattedCommand),
            executor.read(command, args),
            {
              detail: (error) => operationFailureDetails(error),
              label: () => {
                operationFailed = true;
                return formattedCommand;
              },
            },
          );
        },
        run: (command: string, args: ReadonlyArray<string>) => {
          const formattedCommand = formatCommand(command, args);
          const commandEffect: Effect.Effect<
            void,
            CommandExecutionError | PlatformError.PlatformError
          > = dryRun ? Effect.void : executor.run(command, args);

          return runSetSpinner(
            formattedCommand,
            renderSetCommandLine(formattedCommand),
            commandEffect,
            {
              detail: (error) => operationFailureDetails(error),
              label: () => {
                operationFailed = true;
                return formattedCommand;
              },
            },
          );
        },
      };
      const loggingFileSystem: typeof fileSystem = {
        ...fileSystem,
        makeDirectory: (path: string, options) =>
          dryRun ? Effect.void : fileSystem.makeDirectory(path, options),
        writeFileString: (path: string, data: string, options) => {
          const writeEffect: Effect.Effect<void, PlatformError.PlatformError> =
            dryRun
              ? Effect.void
              : fileSystem.writeFileString(path, data, options);

          return runSetSpinner(
            collapseHomePath(path, homePath),
            renderSetCreateLine(path, homePath),
            writeEffect,
            {
              detail: (error) => operationFailureDetails(error),
              label: () => {
                operationFailed = true;
                return collapseHomePath(path, homePath);
              },
            },
          );
        },
      };
      const applyResult = yield* Effect.result(
        adapter
          .apply(preparedTheme.theme)
          .pipe(
            Effect.provideService(CommandExecutor, loggingExecutor),
            Effect.provideService(FileSystem.FileSystem, loggingFileSystem),
          ),
      );

      if (Result.isFailure(applyResult)) {
        if (operationFailed) {
          errorCount += 1;
          continue;
        }

        const failureDisplay = targetFailureDisplay(
          applyResult.failure,
          homePath,
        );

        yield* printSetTargetFailure(
          failureDisplay.reason,
          failureDisplay.detail,
        );
        errorCount += 1;
      }
    }

    const elapsedMs =
      startedAt === undefined ? undefined : Date.now() - startedAt;

    yield* printSetResult(preparedTheme.theme.id, targetCount, {
      dryRun,
      elapsedMs,
      errorCount,
    });
  });

const setCommand = Command.make(
  'set',
  {
    dryRun: dryRunFlag,
    theme: themeArg,
  },
  (commandConfig) =>
    Effect.gen(function* () {
      const configStore = yield* ConfigStore;
      const othemeConfig = yield* configStore.read();
      const preparedTheme = yield* prepareSetTheme(
        commandConfig.theme,
        othemeConfig,
      );

      if (commandConfig.dryRun) {
        yield* runSet(preparedTheme, true);
        return;
      }

      const stateStore = yield* StateStore;
      yield* stateStore.write({ theme: preparedTheme.theme.id });
      yield* runSet(preparedTheme, false);
    }),
).pipe(Command.withDescription('Apply a theme to supported targets'));

const listAliases = Effect.gen(function* () {
  const aliasStore = yield* AliasStore;
  const aliases = yield* aliasStore.list();
  const keys = Object.keys(aliases).sort();

  for (const key of keys) {
    yield* Console.log(`${key} -> ${aliases[key]}`);
  }
});

const aliasSetCommand = Command.make(
  'set',
  {
    alias: aliasArg,
    theme: aliasThemeArg,
  },
  (config) =>
    Effect.gen(function* () {
      const theme = yield* loadTheme(config.theme);
      const aliasStore = yield* AliasStore;

      yield* aliasStore.set(config.alias, theme.id);
      yield* Console.log(`${config.alias} -> ${theme.id}`);
    }),
).pipe(Command.withDescription('Set a theme alias'));

const aliasCommand = Command.make('alias').pipe(
  Command.withHandler(() => listAliases),
  Command.withSubcommands([aliasSetCommand]),
  Command.withDescription('List or update theme aliases'),
);

const configCommand = Command.make('config', {}, () =>
  Effect.gen(function* () {
    const configStore = yield* ConfigStore;
    const result = yield* configStore.init();

    if (result.wasCreated) {
      yield* Console.log(`Created config at ${result.path}`);
      yield* Console.log(
        'Targets are disabled by default. Edit the file to enable targets.',
      );
    } else {
      yield* Console.log(`Config already exists at ${result.path}`);
    }
  }),
).pipe(
  Command.withDescription(
    'Initialize the otheme config file if it does not exist',
  ),
);

export const cli = Command.make('otheme').pipe(
  Command.withSubcommands([setCommand, aliasCommand, configCommand]),
  Command.withDescription('Apply shared themes to editor and terminal targets'),
);

const commandExecutorLayer = CommandExecutor.layer.pipe(
  Layer.provide(NodeServices.layer),
);

const mainLayer = Layer.mergeAll(
  NodeServices.layer,
  ConfigStore.layer,
  AliasStore.layer,
  StateStore.layer,
  commandExecutorLayer,
);

NodeRuntime.runMain(
  Command.run(cli, { version: packageJson.version }).pipe(
    Effect.provide(mainLayer),
  ),
);
