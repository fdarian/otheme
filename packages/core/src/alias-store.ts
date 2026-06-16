import {
  Config,
  Context,
  Effect,
  FileSystem,
  Layer,
  Path,
  Schema,
} from 'effect';
import { AliasNotFoundError } from './errors.ts';

const seedAliasEntries = [
  ['dark', 'vesper'],
  ['light', 'atom-one-light'],
] as const;

export const AliasConfig = Schema.Struct({
  aliases: Schema.Record(Schema.String, Schema.String),
});

export type AliasConfig = typeof AliasConfig.Type;

const AliasConfigJson = Schema.fromJsonString(AliasConfig);
const decodeAliasConfig = Schema.decodeUnknownEffect(AliasConfigJson);

const makeSeedAliases = (): Record<string, string> => {
  const aliases: Record<string, string> = {};

  for (const entry of seedAliasEntries) {
    aliases[entry[0]] = entry[1];
  }

  return aliases;
};

const makeSeedConfig = (): AliasConfig => ({
  aliases: makeSeedAliases(),
});

const getConfigPath = Effect.gen(function* () {
  const home = yield* Config.string('HOME');
  const path = yield* Path.Path;

  return path.join(home, '.config', 'otheme', 'config.json');
});

const readConfig = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const configPath = yield* getConfigPath;
  const exists = yield* fs.exists(configPath);

  if (!exists) {
    return makeSeedConfig();
  }

  const content = yield* fs.readFileString(configPath);

  return yield* decodeAliasConfig(content);
});

const writeConfig = (config: AliasConfig) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const configPath = yield* getConfigPath;

    yield* fs.makeDirectory(path.dirname(configPath), { recursive: true });
    yield* fs.writeFileString(
      configPath,
      `${JSON.stringify(config, null, 2)}\n`,
    );
  });

type ReadConfigError =
  typeof readConfig extends Effect.Effect<unknown, infer Error, unknown>
    ? Error
    : never;

type WriteConfigError =
  ReturnType<typeof writeConfig> extends Effect.Effect<
    unknown,
    infer Error,
    unknown
  >
    ? Error
    : never;

export class AliasStore extends Context.Service<
  AliasStore,
  {
    readonly list: () => Effect.Effect<
      Record<string, string>,
      ReadConfigError,
      FileSystem.FileSystem | Path.Path
    >;
    readonly resolve: (
      alias: string,
    ) => Effect.Effect<
      string,
      AliasNotFoundError | ReadConfigError,
      FileSystem.FileSystem | Path.Path
    >;
    readonly set: (
      alias: string,
      themeId: string,
    ) => Effect.Effect<
      void,
      ReadConfigError | WriteConfigError,
      FileSystem.FileSystem | Path.Path
    >;
  }
>()('otheme/AliasStore', {
  make: Effect.succeed({
    list: () =>
      Effect.gen(function* () {
        const config = yield* readConfig;

        return Object.assign({}, config.aliases);
      }),
    resolve: (alias: string) =>
      Effect.gen(function* () {
        const config = yield* readConfig;
        const themeId = config.aliases[alias];

        if (themeId === undefined) {
          return yield* Effect.fail(new AliasNotFoundError({ alias }));
        }

        return themeId;
      }),
    set: (alias: string, themeId: string) =>
      Effect.gen(function* () {
        const config = yield* readConfig;
        const aliases: Record<string, string> = Object.assign(
          {},
          config.aliases,
        );
        aliases[alias] = themeId;

        yield* writeConfig({ aliases });
      }),
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
