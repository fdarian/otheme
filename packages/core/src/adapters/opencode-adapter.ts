import { Config, Effect, FileSystem, Path, Schema } from 'effect';
import { AdapterError } from '../errors.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import { renderOpencodeTheme } from './opencode-renderer.ts';
import {
  getOpencodeTarget,
  missingTargetPlan,
  requireOpencodeTarget,
} from './target-selectors.ts';

const opencodeTuiPath = '~/.config/opencode/tui.json';
const opencodeThemePathFor = (theme: Theme): string =>
  `~/.config/opencode/themes/${theme.id}.json`;
const SettingsJson = Schema.fromJsonString(
  Schema.Record(Schema.String, Schema.Unknown),
);
const decodeSettingsJson = Schema.decodeUnknownEffect(SettingsJson);

const detectJsonIndent = (content: string): string | number => {
  const match = content.match(/\n([ \t]+)"/);

  if (match !== null && match[1] !== undefined) {
    return match[1];
  }

  return 2;
};

const formatSettingsJson = (
  settings: Record<string, unknown>,
  originalContent: string,
): string => {
  const trailingNewline = originalContent.endsWith('\n') ? '\n' : '';

  return `${JSON.stringify(settings, null, detectJsonIndent(originalContent))}${trailingNewline}`;
};

const readSettings = (content: string) =>
  decodeSettingsJson(content).pipe(
    Effect.mapError(
      (error) =>
        new AdapterError({
          adapterId: 'opencode',
          message: `Could not parse opencode TUI JSON: ${String(error)}`,
        }),
    ),
  );

export const updateOpencodeTui = (content: string, themeValue: string) =>
  Effect.gen(function* () {
    if (content.length === 0) {
      return `${JSON.stringify({ theme: themeValue }, null, 2)}\n`;
    }

    const settings = yield* readSettings(content);
    const nextSettings: Record<string, unknown> = Object.assign({}, settings);
    nextSettings.theme = themeValue;

    return formatSettingsJson(nextSettings, content);
  });

const renderOpencodeThemeJson = (theme: Theme): string =>
  `${JSON.stringify(renderOpencodeTheme(theme), null, 2)}\n`;

export const opencodeAdapter: TargetAdapter = {
  id: 'opencode',
  plan: (theme: Theme) => {
    if (getOpencodeTarget(theme) === undefined) {
      return missingTargetPlan(theme, 'opencode');
    }

    return {
      commands: [],
      creates: [
        {
          path: opencodeThemePathFor(theme),
          summary: `write generated opencode theme ${theme.id}`,
        },
        {
          path: opencodeTuiPath,
          summary: `set JSON key theme = ${theme.id}`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      yield* requireOpencodeTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');
      const tuiPath = path.join(home, '.config', 'opencode', 'tui.json');
      const tuiExists = yield* fs.exists(tuiPath);
      const tuiContent = tuiExists ? yield* fs.readFileString(tuiPath) : '';
      const nextTuiContent = yield* updateOpencodeTui(tuiContent, theme.id);
      const themePath = path.join(
        home,
        '.config',
        'opencode',
        'themes',
        `${theme.id}.json`,
      );

      yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
      yield* fs.writeFileString(themePath, renderOpencodeThemeJson(theme));
      yield* fs.makeDirectory(path.dirname(tuiPath), { recursive: true });
      yield* fs.writeFileString(tuiPath, nextTuiContent);
    }),
};
