#!/usr/bin/env node

import { NodeRuntime, NodeServices } from '@effect/platform-node';
import {
  AliasStore,
  CommandExecutor,
  ConfigStore,
  isThemeId,
  loadTheme,
  type OthemeConfig,
  type PartialTargets,
  type TargetAdapter,
  type Theme,
  targetAdapters,
} from '@otheme/core';
import { Console, Effect, Layer } from 'effect';
import { Argument, Command, Flag } from 'effect/unstable/cli';
import packageJson from '../package.json';

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

const mergeTargetOverride = (
  targets: Theme['targets'],
  override: PartialTargets | undefined,
): Theme['targets'] => {
  if (override === undefined) {
    return targets;
  }

  return {
    'claude-code':
      targets['claude-code'] !== undefined &&
      override['claude-code'] !== undefined
        ? { ...targets['claude-code'], ...override['claude-code'] }
        : targets['claude-code'],
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
    tmux:
      targets.tmux !== undefined && override.tmux !== undefined
        ? { ...targets.tmux, ...override.tmux }
        : targets.tmux,
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

const printAdapterPlan = (adapter: TargetAdapter, theme: Theme) =>
  Effect.gen(function* () {
    const plan = adapter.plan(theme);

    yield* Console.log(`[${adapter.id}]`);

    if (plan.creates.length > 0) {
      yield* Console.log('files:');

      for (const create of plan.creates) {
        yield* Console.log(`  - ${create.path}`);
        yield* Console.log(`    ${create.summary}`);
      }
    }

    if (plan.commands.length > 0) {
      yield* Console.log('commands:');

      for (const command of plan.commands) {
        yield* Console.log(`  - ${command.cmd}`);
        yield* Console.log(`    ${command.why}`);
      }
    }
  });

const printDryRun = (themeId: string, config: OthemeConfig) =>
  Effect.gen(function* () {
    const rawTheme = yield* loadTheme(themeId);
    const theme = withOverrides(rawTheme, config);
    const enabledAdapters = getEnabledAdapters(config);

    if (enabledAdapters.length === 0) {
      yield* noTargetsNotice;
      return;
    }

    yield* Console.log(`theme: ${theme.id} (${theme.name})`);

    for (let index = 0; index < enabledAdapters.length; index += 1) {
      if (index > 0) {
        yield* Console.log('');
      }

      const adapter = enabledAdapters[index];

      if (adapter === undefined) {
        continue;
      }

      yield* printAdapterPlan(adapter, theme);
    }
  });

const applyTheme = (themeId: string, config: OthemeConfig) =>
  Effect.gen(function* () {
    const rawTheme = yield* loadTheme(themeId);
    const theme = withOverrides(rawTheme, config);
    const enabledAdapters = getEnabledAdapters(config);

    if (enabledAdapters.length === 0) {
      yield* noTargetsNotice;
      return;
    }

    for (const adapter of enabledAdapters) {
      yield* adapter.apply(theme);
    }
  });

const setCommand = Command.make(
  'set',
  {
    dryRun: dryRunFlag,
    theme: themeArg,
  },
  (config) =>
    Effect.gen(function* () {
      const theme = yield* loadThemeOrAlias(config.theme);
      const configStore = yield* ConfigStore;
      const othemeConfig = yield* configStore.read();

      if (config.dryRun) {
        yield* printDryRun(theme.id, othemeConfig);
        return;
      }

      yield* applyTheme(theme.id, othemeConfig);
      yield* Console.log(`applied ${theme.id}`);
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
  commandExecutorLayer,
);

NodeRuntime.runMain(
  Command.run(cli, { version: packageJson.version }).pipe(
    Effect.provide(mainLayer),
  ),
);
