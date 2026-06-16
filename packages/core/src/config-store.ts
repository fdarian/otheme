import {
  Config,
  Context,
  Effect,
  FileSystem,
  Layer,
  Path,
  Schema,
} from 'effect';

const TargetsConfig = Schema.Struct({
  'claude-code': Schema.optional(Schema.Boolean),
  'git-delta': Schema.optional(Schema.Boolean),
  ghostty: Schema.optional(Schema.Boolean),
  macos: Schema.optional(Schema.Boolean),
  nvim: Schema.optional(Schema.Boolean),
  tmux: Schema.optional(Schema.Boolean),
});

export const OthemeConfig = Schema.Struct({
  $schema: Schema.optional(Schema.String),
  aliases: Schema.Record(Schema.String, Schema.String),
  targets: Schema.optional(TargetsConfig),
});

export type OthemeConfig = typeof OthemeConfig.Type;
export type TargetsConfig = typeof TargetsConfig.Type;

const configSchemaUrl =
  'https://raw.githubusercontent.com/fdarian/otheme/main/packages/core/config.schema.json';

const OthemeConfigJson = Schema.fromJsonString(OthemeConfig);
const decodeOthemeConfig = Schema.decodeUnknownEffect(OthemeConfigJson);

const makeDefaultConfig = (): OthemeConfig => {
  const aliases: Record<string, string> = {};
  aliases.dark = 'vesper';
  aliases.light = 'atom-one-light';
  return {
    $schema: configSchemaUrl,
    aliases,
    targets: {},
  };
};

const getConfigPath = Effect.gen(function* () {
  const home = yield* Config.string('HOME');
  const path = yield* Path.Path;
  return path.join(home, '.config', 'otheme', 'config.json');
});

const readConfigFromDisk = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const configPath = yield* getConfigPath;
  const exists = yield* fs.exists(configPath);

  if (!exists) {
    return makeDefaultConfig();
  }

  const content = yield* fs.readFileString(configPath);
  return yield* decodeOthemeConfig(content);
});

const writeConfigToDisk = (config: OthemeConfig) =>
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

type ReadError =
  typeof readConfigFromDisk extends Effect.Effect<unknown, infer E, unknown>
    ? E
    : never;

type WriteError =
  ReturnType<typeof writeConfigToDisk> extends Effect.Effect<
    unknown,
    infer E,
    unknown
  >
    ? E
    : never;

export type ConfigReadError = ReadError;
export type ConfigWriteError = WriteError;

export class ConfigStore extends Context.Service<
  ConfigStore,
  {
    readonly read: () => Effect.Effect<
      OthemeConfig,
      ReadError,
      FileSystem.FileSystem | Path.Path
    >;
    readonly write: (
      config: OthemeConfig,
    ) => Effect.Effect<void, WriteError, FileSystem.FileSystem | Path.Path>;
    readonly init: () => Effect.Effect<
      { wasCreated: boolean; path: string },
      ReadError | WriteError,
      FileSystem.FileSystem | Path.Path
    >;
  }
>()('otheme/ConfigStore', {
  make: Effect.succeed({
    read: () => readConfigFromDisk,
    write: (config: OthemeConfig) => writeConfigToDisk(config),
    init: () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const configPath = yield* getConfigPath;
        const exists = yield* fs.exists(configPath);

        if (exists) {
          const content = yield* fs.readFileString(configPath);
          yield* decodeOthemeConfig(content);
          return { wasCreated: false, path: configPath };
        }

        yield* writeConfigToDisk(makeDefaultConfig());
        return { wasCreated: true, path: configPath };
      }),
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
