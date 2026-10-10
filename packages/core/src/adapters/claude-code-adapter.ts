import { Config, Effect, FileSystem, Path, Schema } from 'effect';
import { AdapterError } from '../errors.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import { renderClaudeCodeTheme } from './claude-code-renderer.ts';
import {
  getClaudeCodeTarget,
  missingTargetPlan,
  requireClaudeCodeTarget,
} from './target-selectors.ts';

const claudeSettingsPath = '~/.claude/settings.json';
// Claude Code live-reloads the active custom theme file but can't switch theme
// names at runtime, so every authored theme is written to this one file.
const claudeThemeName = 'otheme';
const claudeThemePath = `~/.claude/themes/${claudeThemeName}.json`;
const claudeThemeValue = `custom:${claudeThemeName}`;
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
          adapterId: 'claude-code',
          message: `Could not parse Claude Code settings JSON: ${String(error)}`,
        }),
    ),
  );

export const updateClaudeCodeSettings = (content: string, themeValue: string) =>
  Effect.gen(function* () {
    if (content.length === 0) {
      return `${JSON.stringify({ theme: themeValue }, null, 2)}\n`;
    }

    const settings = yield* readSettings(content);
    const nextSettings: Record<string, unknown> = Object.assign({}, settings);
    nextSettings.theme = themeValue;

    return formatSettingsJson(nextSettings, content);
  });

export const claudeCodeAdapter: TargetAdapter = {
  id: 'claude-code',
  plan: (theme: Theme) => {
    const target = getClaudeCodeTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'claude-code');
    }

    if (target.mode === 'author') {
      return {
        commands: [],
        creates: [
          {
            path: claudeThemePath,
            summary: `write generated Claude Code theme ${theme.id}`,
          },
          {
            path: claudeSettingsPath,
            summary: `set JSON key theme = ${claudeThemeValue}`,
          },
        ],
      };
    }

    return {
      commands: [],
      creates: [
        {
          path: claudeSettingsPath,
          summary: `set JSON key theme = ${target.mapTo}`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requireClaudeCodeTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.String('HOME');
      const settingsPath = path.join(home, '.claude', 'settings.json');
      const exists = yield* fs.exists(settingsPath);
      const content = exists ? yield* fs.readFileString(settingsPath) : '';
      const themeValue =
        target.mode === 'author' ? claudeThemeValue : target.mapTo;
      const nextContent = yield* updateClaudeCodeSettings(content, themeValue);

      if (target.mode === 'author') {
        const themePath = path.join(
          home,
          '.claude',
          'themes',
          `${claudeThemeName}.json`,
        );

        yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
        yield* fs.writeFileString(themePath, renderClaudeCodeTheme(theme));
      }

      yield* fs.makeDirectory(path.dirname(settingsPath), { recursive: true });
      yield* fs.writeFileString(settingsPath, nextContent);
    }),
};
