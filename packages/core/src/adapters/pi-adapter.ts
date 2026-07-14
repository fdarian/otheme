import { Config, Effect, FileSystem, Path, Schema } from 'effect';
import { AdapterError } from '../errors.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import { renderPiTheme } from './pi-renderer.ts';
import {
  getPiTarget,
  missingTargetPlan,
  requirePiTarget,
} from './target-selectors.ts';

const piSettingsPath = '~/.pi/agent/settings.json';
const piThemePathFor = (theme: Theme): string =>
  `~/.pi/agent/themes/${theme.id}.json`;
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
          adapterId: 'pi',
          message: `Could not parse pi settings JSON: ${String(error)}`,
        }),
    ),
  );

export const updatePiSettings = (content: string, themeValue: string) =>
  Effect.gen(function* () {
    if (content.length === 0) {
      return `${JSON.stringify({ theme: themeValue }, null, 2)}\n`;
    }

    const settings = yield* readSettings(content);
    const nextSettings: Record<string, unknown> = Object.assign({}, settings);
    nextSettings.theme = themeValue;

    return formatSettingsJson(nextSettings, content);
  });

export const piAdapter: TargetAdapter = {
  id: 'pi',
  plan: (theme: Theme) => {
    const target = getPiTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'pi');
    }

    if (target.mode === 'author') {
      return {
        commands: [],
        creates: [
          {
            path: piThemePathFor(theme),
            summary: `write generated pi theme ${theme.id}`,
          },
          {
            path: piSettingsPath,
            summary: `set JSON key theme = ${theme.id}`,
          },
        ],
      };
    }

    return {
      commands: [],
      creates: [
        {
          path: piSettingsPath,
          summary: `set JSON key theme = ${target.mapTo}`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requirePiTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');
      const settingsPath = path.join(home, '.pi', 'agent', 'settings.json');
      const exists = yield* fs.exists(settingsPath);
      const content = exists ? yield* fs.readFileString(settingsPath) : '';
      const themeValue = target.mode === 'author' ? theme.id : target.mapTo;
      const nextContent = yield* updatePiSettings(content, themeValue);

      if (target.mode === 'author') {
        const themePath = path.join(
          home,
          '.pi',
          'agent',
          'themes',
          `${theme.id}.json`,
        );

        yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
        yield* fs.writeFileString(themePath, renderPiTheme(theme));
      }

      yield* fs.makeDirectory(path.dirname(settingsPath), { recursive: true });
      yield* fs.writeFileString(settingsPath, nextContent);
    }),
};
