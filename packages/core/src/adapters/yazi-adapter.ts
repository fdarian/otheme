import { Config, Effect, FileSystem, Path } from 'effect';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  getYaziTarget,
  missingTargetPlan,
  requireYaziTarget,
} from './target-selectors.ts';
import { renderYaziTheme, yaziThemeRelPath } from './yazi-renderer.ts';

export const yaziAdapter: TargetAdapter = {
  id: 'yazi',
  plan: (theme: Theme) => {
    const target = getYaziTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'yazi');
    }

    return {
      commands: [],
      creates: [
        {
          path: `~/${yaziThemeRelPath}`,
          summary: 'write generated yazi theme.toml from the palette',
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      yield* requireYaziTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');
      const themePath = path.join(home, yaziThemeRelPath);

      yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
      yield* fs.writeFileString(themePath, renderYaziTheme(theme));
    }),
};
