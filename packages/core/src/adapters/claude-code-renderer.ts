import type { Appearance, Theme } from '../theme-schema.ts';
import type { ClaudeCodeThemeToken } from './claude-code-tokens.ts';

interface ClaudeCodeThemeDocument {
  readonly base: Appearance;
  readonly name: string;
  readonly overrides: Partial<Record<ClaudeCodeThemeToken, string>>;
}

const claudeCodeThemeOverrides = (
  theme: Theme,
): Partial<Record<ClaudeCodeThemeToken, string>> => ({
  // Override only identity (bg/fg/brand), semantic status, diffs, message and
  // selection backgrounds, the prompt border, autocomplete selection, and the
  // two faithful subagent hues. Secondary text, mode indicators, and
  // decorative tokens inherit from Claude Code's base preset to stay balanced
  // and neutral.
  background: theme.ui.bg,
  text: theme.ui.fg,
  inverseText: theme.ui.accentFg,
  claude: theme.ui.accent,
  success: theme.ui.success,
  error: theme.ui.error,
  warning: theme.ui.warning,
  diffAdded: theme.ui.diffAdd,
  diffRemoved: theme.ui.diffDel,
  diffAddedWord: theme.ui.success,
  diffRemovedWord: theme.ui.error,
  selectionBg: theme.ui.bgVisual,
  userMessageBackground: theme.ui.bgFloat,
  userMessageBackgroundHover: theme.ui.bgHover,
  bashMessageBackgroundColor: theme.ui.bgFloat,
  memoryBackgroundColor: theme.ui.bgFloat,
  suggestion: theme.ui.accent,
  promptBorder: theme.ui.border,
  red_FOR_SUBAGENTS_ONLY: theme.ui.error,
  green_FOR_SUBAGENTS_ONLY: theme.ui.success,
});

export const renderClaudeCodeTheme = (theme: Theme): string => {
  const document: ClaudeCodeThemeDocument = {
    base: theme.appearance,
    name: theme.name,
    overrides: claudeCodeThemeOverrides(theme),
  };

  return JSON.stringify(document, null, 2);
};
