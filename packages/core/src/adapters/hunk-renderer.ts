import type { Theme } from '../theme-schema.ts';
import type { HunkThemeToken } from './hunk-tokens.ts';
import { getHunkTarget } from './target-selectors.ts';

export interface HunkThemeTokens
  extends Readonly<Record<HunkThemeToken, string>> {}

type UiColorToken = keyof Theme['ui'];
type SyntaxColorToken = keyof Theme['syntax'];

const managedRegionStart = '# >>> otheme (hunk) >>>';
const managedRegionEnd = '# <<< otheme (hunk) <<<';

const requireUiColor = (theme: Theme, token: UiColorToken): string => {
  const value = theme.ui[token];

  if (value === undefined) {
    throw new Error(`Hunk renderer requires ui.${token} for theme ${theme.id}`);
  }

  return value;
};

const requireSyntaxColor = (theme: Theme, token: SyntaxColorToken): string => {
  const value = theme.syntax[token];

  if (value === undefined) {
    throw new Error(
      `Hunk renderer requires syntax.${token} for theme ${theme.id}`,
    );
  }

  return value;
};

const hunkThemeOverrides = (
  theme: Theme,
): Partial<Record<HunkThemeToken, string>> => {
  const target = getHunkTarget(theme);

  if (target === undefined || target.overrides === undefined) {
    return {};
  }

  return target.overrides;
};

const renderInlineValue = (value: string): string => JSON.stringify(value);

const syntaxKeyName = (token: HunkThemeToken): string => {
  const suffix = token.slice('syntax'.length);
  const firstCharacter = suffix[0];

  if (firstCharacter === undefined) {
    throw new Error(`Invalid hunk syntax token: ${token}`);
  }

  return `${firstCharacter.toLowerCase()}${suffix.slice(1)}`;
};

export const renderHunkThemeTokens = (theme: Theme): HunkThemeTokens => {
  const baseTheme: HunkThemeTokens = {
    background: requireUiColor(theme, 'bg'),
    panel: requireUiColor(theme, 'bgFloat'),
    panelAlt: requireUiColor(theme, 'bgHover'),
    border: requireUiColor(theme, 'border'),
    accent: requireUiColor(theme, 'accent'),
    accentMuted: requireUiColor(theme, 'bgVisual'),
    text: requireUiColor(theme, 'fg'),
    muted: requireUiColor(theme, 'fgMuted'),
    addedBg: requireUiColor(theme, 'diffAdd'),
    removedBg: requireUiColor(theme, 'diffDel'),
    movedAddedBg: requireUiColor(theme, 'diffAdd'),
    movedRemovedBg: requireUiColor(theme, 'diffDel'),
    contextBg: requireUiColor(theme, 'bg'),
    addedContentBg: requireUiColor(theme, 'diffAddEmph'),
    removedContentBg: requireUiColor(theme, 'diffDelEmph'),
    contextContentBg: requireUiColor(theme, 'bgHover'),
    addedSignColor: requireUiColor(theme, 'success'),
    removedSignColor: requireUiColor(theme, 'error'),
    lineNumberBg: requireUiColor(theme, 'bgFloat'),
    lineNumberFg: requireUiColor(theme, 'lineNr'),
    selectedHunk: requireUiColor(theme, 'bgVisual'),
    badgeAdded: requireUiColor(theme, 'success'),
    badgeRemoved: requireUiColor(theme, 'error'),
    badgeNeutral: requireUiColor(theme, 'fgMuted'),
    fileNew: requireUiColor(theme, 'success'),
    fileDeleted: requireUiColor(theme, 'error'),
    fileRenamed: requireUiColor(theme, 'info'),
    fileModified: requireUiColor(theme, 'warning'),
    fileUntracked: requireUiColor(theme, 'comment'),
    noteBorder: requireUiColor(theme, 'border'),
    noteBackground: requireUiColor(theme, 'bgFloat'),
    noteTitleBackground: requireUiColor(theme, 'bgHover'),
    noteTitleText: requireUiColor(theme, 'fg'),
    syntaxDefault: requireUiColor(theme, 'fg'),
    syntaxKeyword: requireSyntaxColor(theme, 'keyword'),
    syntaxString: requireSyntaxColor(theme, 'string'),
    syntaxComment: requireUiColor(theme, 'comment'),
    syntaxNumber: requireSyntaxColor(theme, 'number'),
    syntaxFunction: requireSyntaxColor(theme, 'func'),
    syntaxProperty: requireSyntaxColor(theme, 'variableMember'),
    syntaxType: requireSyntaxColor(theme, 'type'),
    syntaxVariable: requireSyntaxColor(theme, 'variable'),
    syntaxOperator: requireSyntaxColor(theme, 'operator'),
    syntaxPunctuation: requireSyntaxColor(theme, 'punctuation'),
  };

  return Object.assign({}, baseTheme, hunkThemeOverrides(theme));
};

export const renderHunkManagedRegion = (theme: Theme): string => {
  const tokens = renderHunkThemeTokens(theme);
  const lines: Array<string> = [];

  lines.push(managedRegionStart);
  lines.push('theme = "custom"');
  lines.push('');
  lines.push('[custom_theme]');
  lines.push(
    `base = ${renderInlineValue(theme.appearance === 'dark' ? 'graphite' : 'paper')}`,
  );
  lines.push(`label = ${renderInlineValue('otheme')}`);

  for (const token of Object.keys(tokens) as Array<HunkThemeToken>) {
    if (token.startsWith('syntax')) {
      continue;
    }

    lines.push(`${token} = ${renderInlineValue(tokens[token])}`);
  }

  lines.push('');
  lines.push('[custom_theme.syntax]');

  for (const token of Object.keys(tokens) as Array<HunkThemeToken>) {
    if (!token.startsWith('syntax')) {
      continue;
    }

    lines.push(`${syntaxKeyName(token)} = ${renderInlineValue(tokens[token])}`);
  }

  lines.push(managedRegionEnd);
  return `${lines.join('\n')}\n`;
};

const escapeForRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const removeManagedRegion = (content: string): string => {
  const managedRegionPattern = new RegExp(
    `${escapeForRegex(managedRegionStart)}[\\s\\S]*?${escapeForRegex(managedRegionEnd)}\\n?`,
    'g',
  );

  return content.replace(managedRegionPattern, '');
};

const removeLeadingThemeAssignment = (content: string): string => {
  const lines = content.split(/\r?\n/);
  const nextLines: Array<string> = [];
  let sawTable = false;
  let removedTheme = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('[')) {
      sawTable = true;
      nextLines.push(line);
      continue;
    }

    if (!sawTable && !removedTheme && /^theme\s*=/.test(trimmed)) {
      removedTheme = true;
      continue;
    }

    nextLines.push(line);
  }

  return nextLines.join('\n').replace(/^\n+/, '');
};

export const mergeHunkConfig = (content: string, theme: Theme): string => {
  const unmanagedContent = removeLeadingThemeAssignment(
    removeManagedRegion(content),
  )
    .replace(/^\s+/, '')
    .replace(/\n+$/, '');
  const managedRegion = renderHunkManagedRegion(theme);

  if (unmanagedContent.length === 0) {
    return managedRegion;
  }

  return `${managedRegion}\n${unmanagedContent}\n`;
};
