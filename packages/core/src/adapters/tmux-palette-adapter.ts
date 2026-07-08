import { Config, Effect, FileSystem, Path } from 'effect';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  getTmuxPaletteTarget,
  missingTargetPlan,
  requireTmuxPaletteTarget,
} from './target-selectors.ts';
import {
  renderTmuxPaletteTheme,
  tmuxPaletteThemeName,
} from './tmux-palette-renderer.ts';

const tmuxPaletteActiveThemePath = '~/.config/tmux-palette/theme.json';

const tmuxPaletteThemePathFor = (theme: Theme): string =>
  `~/.config/tmux-palette/themes/${tmuxPaletteThemeName(theme)}.json`;

export const tmuxPaletteAdapter: TargetAdapter = {
  id: 'tmux-palette',
  plan: (theme: Theme) => {
    const target = getTmuxPaletteTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'tmux-palette');
    }

    const activeThemeName =
      target.mode === 'author' ? tmuxPaletteThemeName(theme) : target.mapTo;

    const creates = [];

    if (target.mode === 'author') {
      creates.push({
        path: tmuxPaletteThemePathFor(theme),
        summary: `write generated tmux-palette theme ${tmuxPaletteThemeName(theme)}`,
      });
    }

    creates.push({
      path: tmuxPaletteActiveThemePath,
      summary: `set JSON key name = ${activeThemeName}`,
    });

    return {
      commands: [],
      creates,
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requireTmuxPaletteTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');
      const activeThemePath = path.join(
        home,
        '.config',
        'tmux-palette',
        'theme.json',
      );

      const activeThemeName =
        target.mode === 'author' ? tmuxPaletteThemeName(theme) : target.mapTo;

      if (target.mode === 'author') {
        const themePath = path.join(
          home,
          '.config',
          'tmux-palette',
          'themes',
          `${activeThemeName}.json`,
        );

        yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
        yield* fs.writeFileString(
          themePath,
          renderTmuxPaletteTheme(theme, target),
        );
      }

      yield* fs.makeDirectory(path.dirname(activeThemePath), {
        recursive: true,
      });
      yield* fs.writeFileString(
        activeThemePath,
        `${JSON.stringify({ name: activeThemeName }, null, 2)}\n`,
      );
    }),
};
