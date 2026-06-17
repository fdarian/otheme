import {
  Config,
  Context,
  Effect,
  FileSystem,
  Layer,
  Path,
  Schema,
} from 'effect';

const OthemeState = Schema.Struct({
  theme: Schema.String,
});

export type OthemeState = typeof OthemeState.Type;

const OthemeStateJson = Schema.fromJsonString(OthemeState);
const decodeOthemeState = Schema.decodeUnknownEffect(OthemeStateJson);

const getStatePath = Effect.gen(function* () {
  const home = yield* Config.string('HOME');
  const path = yield* Path.Path;
  return path.join(home, '.config', 'otheme', 'state.json');
});

const writeStateToDisk = (state: OthemeState) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const statePath = yield* getStatePath;

    yield* fs.makeDirectory(path.dirname(statePath), { recursive: true });
    yield* fs.writeFileString(statePath, `${JSON.stringify(state, null, 2)}\n`);
  });

const readStateFromDisk = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const statePath = yield* getStatePath;
  const exists = yield* fs.exists(statePath);

  if (!exists) {
    return undefined;
  }

  const content = yield* fs.readFileString(statePath);
  return yield* decodeOthemeState(content);
});

type WriteError =
  ReturnType<typeof writeStateToDisk> extends Effect.Effect<
    unknown,
    infer E,
    unknown
  >
    ? E
    : never;

type ReadError =
  typeof readStateFromDisk extends Effect.Effect<unknown, infer E, unknown>
    ? E
    : never;

export type StateReadError = ReadError;
export type StateWriteError = WriteError;

export class StateStore extends Context.Service<
  StateStore,
  {
    readonly read: () => Effect.Effect<
      OthemeState | undefined,
      ReadError,
      FileSystem.FileSystem | Path.Path
    >;
    readonly write: (
      state: OthemeState,
    ) => Effect.Effect<void, WriteError, FileSystem.FileSystem | Path.Path>;
  }
>()('otheme/StateStore', {
  make: Effect.succeed({
    read: () => readStateFromDisk,
    write: (state: OthemeState) => writeStateToDisk(state),
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
