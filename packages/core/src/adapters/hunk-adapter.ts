import { Config, Effect, FileSystem, Path } from 'effect';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import { mergeHunkConfig } from './hunk-renderer.ts';
import {
  getHunkTarget,
  missingTargetPlan,
  requireHunkTarget,
} from './target-selectors.ts';

const hunkConfigPath = '~/.config/hunk/config.toml';

export const hunkAdapter: TargetAdapter = {
  id: 'hunk',
  plan: (theme: Theme) => {
    if (getHunkTarget(theme) === undefined) {
      return missingTargetPlan(theme, 'hunk');
    }

    return {
      commands: [],
      creates: [
        {
          path: hunkConfigPath,
          summary:
            'set top-level theme = "custom" and write [custom_theme] plus [custom_theme.syntax]',
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      yield* requireHunkTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');
      const configPath = path.join(home, '.config', 'hunk', 'config.toml');
      const exists = yield* fs.exists(configPath);
      const content = exists ? yield* fs.readFileString(configPath) : '';
      const nextContent = mergeHunkConfig(content, theme);

      yield* fs.makeDirectory(path.dirname(configPath), { recursive: true });
      yield* fs.writeFileString(configPath, nextContent);
    }),
};
