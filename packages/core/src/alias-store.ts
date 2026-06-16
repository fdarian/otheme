import { Context, Effect, type FileSystem, Layer, type Path } from 'effect';
import type { ConfigReadError, ConfigWriteError } from './config-store.ts';
import { ConfigStore } from './config-store.ts';
import { AliasNotFoundError } from './errors.ts';

export class AliasStore extends Context.Service<
  AliasStore,
  {
    readonly list: () => Effect.Effect<
      Record<string, string>,
      ConfigReadError,
      FileSystem.FileSystem | Path.Path
    >;
    readonly resolve: (
      alias: string,
    ) => Effect.Effect<
      string,
      AliasNotFoundError | ConfigReadError,
      FileSystem.FileSystem | Path.Path
    >;
    readonly set: (
      alias: string,
      themeId: string,
    ) => Effect.Effect<
      void,
      ConfigReadError | ConfigWriteError,
      FileSystem.FileSystem | Path.Path
    >;
  }
>()('otheme/AliasStore', {
  make: Effect.gen(function* () {
    const configStore = yield* ConfigStore;

    return {
      list: () =>
        Effect.gen(function* () {
          const config = yield* configStore.read();
          return Object.assign({}, config.aliases);
        }),
      resolve: (alias: string) =>
        Effect.gen(function* () {
          const config = yield* configStore.read();
          const themeId = config.aliases[alias];

          if (themeId === undefined) {
            return yield* Effect.fail(new AliasNotFoundError({ alias }));
          }

          return themeId;
        }),
      set: (alias: string, themeId: string) =>
        Effect.gen(function* () {
          const config = yield* configStore.read();
          const aliases: Record<string, string> = Object.assign(
            {},
            config.aliases,
          );
          aliases[alias] = themeId;
          yield* configStore.write(Object.assign({}, config, { aliases }));
        }),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ConfigStore.layer),
  );
}
