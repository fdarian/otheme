#!/usr/bin/env node

import { BunRuntime, BunServices } from '@effect/platform-bun';
import {
  AliasStore,
  CommandExecutor,
  isThemeId,
  loadTheme,
  targetAdapters,
} from '@otheme/core';
import { Console, Effect, Layer } from 'effect';
import { Argument, Command, Flag } from 'effect/unstable/cli';

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

const printAdapterPlan = (adapterIndex: number, themeId: string) =>
  Effect.gen(function* () {
    const adapter = targetAdapters[adapterIndex];

    if (adapter === undefined) {
      return;
    }

    const theme = yield* loadTheme(themeId);
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

const printDryRun = (themeId: string) =>
  Effect.gen(function* () {
    const theme = yield* loadTheme(themeId);

    yield* Console.log(`theme: ${theme.id} (${theme.name})`);

    for (let index = 0; index < targetAdapters.length; index += 1) {
      if (index > 0) {
        yield* Console.log('');
      }

      yield* printAdapterPlan(index, theme.id);
    }
  });

const applyTheme = (themeId: string) =>
  Effect.gen(function* () {
    const theme = yield* loadTheme(themeId);

    for (const adapter of targetAdapters) {
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

      if (config.dryRun) {
        yield* printDryRun(theme.id);
        return;
      }

      yield* applyTheme(theme.id);
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

export const cli = Command.make('otheme').pipe(
  Command.withSubcommands([setCommand, aliasCommand]),
  Command.withDescription('Apply shared themes to editor and terminal targets'),
);

const commandExecutorLayer = CommandExecutor.layer.pipe(
  Layer.provide(BunServices.layer),
);

const mainLayer = Layer.mergeAll(
  BunServices.layer,
  AliasStore.layer,
  commandExecutorLayer,
);

BunRuntime.runMain(
  Command.run(cli, { version: '0.0.0' }).pipe(Effect.provide(mainLayer)),
);
