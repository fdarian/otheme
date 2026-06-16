import { Effect, Schema } from 'effect';
import { ThemeNotFoundError } from './errors.ts';
import { Theme } from './theme-schema.ts';
import atomOneLightInput from './themes/atom-one-light.json' with {
  type: 'json',
};
import claudeInput from './themes/claude.json' with { type: 'json' };
import vesperInput from './themes/vesper.json' with { type: 'json' };

const decodeTheme = Schema.decodeUnknownSync(Theme);

const vesperTheme = decodeTheme(vesperInput);
const atomOneLightTheme = decodeTheme(atomOneLightInput);
const claudeTheme = decodeTheme(claudeInput);

const builtInThemeList = [
  vesperTheme,
  atomOneLightTheme,
  claudeTheme,
] as const satisfies ReadonlyArray<Theme>;

export const listThemes = (): ReadonlyArray<Theme> => builtInThemeList;

export const listThemeIds = (): ReadonlyArray<string> =>
  builtInThemeList.map((theme) => theme.id);

export const getThemeById = (themeId: string): Theme | undefined => {
  for (const theme of builtInThemeList) {
    if (theme.id === themeId) {
      return theme;
    }
  }

  return undefined;
};

export const isThemeId = (themeId: string): boolean =>
  getThemeById(themeId) !== undefined;

export const loadTheme = (themeId: string) => {
  const theme = getThemeById(themeId);

  if (theme === undefined) {
    return Effect.fail(
      new ThemeNotFoundError({
        available: [...listThemeIds()],
        themeId,
      }),
    );
  }

  return Effect.succeed(theme);
};
