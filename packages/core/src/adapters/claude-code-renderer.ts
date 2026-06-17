import type { Appearance, Theme } from '../theme-schema.ts';

interface ClaudeCodeThemeDocument {
  readonly base: Appearance;
  readonly name: string;
  readonly overrides: Record<string, string>;
}

const claudeCodeThemeOverrides = (theme: Theme): Record<string, string> => ({
  claude: theme.ui.accent,
  professionalBlue: theme.ui.info,
  chromeYellow: theme.ui.warning,
  text: theme.ui.fg,
  inverseText: theme.ui.accentFg,
  inactive: theme.ui.fgDim,
  subtle: theme.ui.fgMuted,
  suggestion: theme.ui.accent,
  remember: theme.ui.hint,
  background: theme.ui.bg,
  success: theme.ui.success,
  error: theme.ui.error,
  warning: theme.ui.warning,
  merged: theme.ui.hint,
  promptBorder: theme.ui.border,
  permission: theme.ui.warning,
  planMode: theme.ui.info,
  autoAccept: theme.ui.success,
  bashBorder: theme.ui.accent,
  ide: theme.ui.info,
  fastMode: theme.ui.accent,
  diffAdded: theme.ui.diffAdd,
  diffRemoved: theme.ui.diffDel,
  diffAddedWord: theme.ui.success,
  diffRemovedWord: theme.ui.error,
  selectionBg: theme.ui.bgVisual,
  userMessageBackground: theme.ui.bgFloat,
  userMessageBackgroundHover: theme.ui.bgHover,
  messageActionsBackground: theme.ui.bgFloat,
  bashMessageBackgroundColor: theme.ui.bgFloat,
  memoryBackgroundColor: theme.ui.bgFloat,
  red_FOR_SUBAGENTS_ONLY: theme.ui.error,
  green_FOR_SUBAGENTS_ONLY: theme.ui.success,
  yellow_FOR_SUBAGENTS_ONLY: theme.ui.warning,
  blue_FOR_SUBAGENTS_ONLY: theme.ui.info,
  purple_FOR_SUBAGENTS_ONLY: theme.ui.hint,
  orange_FOR_SUBAGENTS_ONLY: theme.ui.accent,
});

export const renderClaudeCodeTheme = (theme: Theme): string => {
  const document: ClaudeCodeThemeDocument = {
    base: theme.appearance,
    name: theme.name,
    overrides: claudeCodeThemeOverrides(theme),
  };

  return JSON.stringify(document, null, 2);
};
