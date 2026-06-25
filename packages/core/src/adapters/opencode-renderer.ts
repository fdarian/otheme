import type { Theme } from '../theme-schema.ts';
import type { OpencodeThemeToken } from './opencode-tokens.ts';
import { getOpencodeTarget } from './target-selectors.ts';

export interface OpencodeThemeTokens
  extends Readonly<Record<OpencodeThemeToken, string>> {}

export interface OpencodeThemeDocument {
  readonly $schema: 'https://opencode.ai/theme.json';
  readonly theme: OpencodeThemeTokens;
}

type UiColorToken = keyof Theme['ui'];
type SyntaxColorToken = keyof Theme['syntax'];

const requireUiColor = (theme: Theme, token: UiColorToken): string => {
  const value = theme.ui[token];

  if (value === undefined) {
    throw new Error(
      `Opencode renderer requires ui.${token} for theme ${theme.id}`,
    );
  }

  return value;
};

const requireSyntaxColor = (theme: Theme, token: SyntaxColorToken): string => {
  const value = theme.syntax[token];

  if (value === undefined) {
    throw new Error(
      `Opencode renderer requires syntax.${token} for theme ${theme.id}`,
    );
  }

  return value;
};

const opencodeThemeOverrides = (
  theme: Theme,
): Partial<Record<OpencodeThemeToken, string>> => {
  const target = getOpencodeTarget(theme);

  if (target === undefined || target.overrides === undefined) {
    return {};
  }

  return target.overrides;
};

export const renderOpencodeTheme = (theme: Theme): OpencodeThemeDocument => {
  const baseTheme: OpencodeThemeTokens = {
    primary: requireUiColor(theme, 'accent'),
    secondary: requireSyntaxColor(theme, 'func'),
    accent: requireUiColor(theme, 'hint'),
    error: requireUiColor(theme, 'error'),
    warning: requireUiColor(theme, 'warning'),
    success: requireUiColor(theme, 'success'),
    info: requireUiColor(theme, 'info'),
    text: requireUiColor(theme, 'fg'),
    textMuted: requireUiColor(theme, 'fgMuted'),
    background: requireUiColor(theme, 'bg'),
    backgroundPanel: requireUiColor(theme, 'bgFloat'),
    backgroundElement: requireUiColor(theme, 'bgHover'),
    border: requireUiColor(theme, 'border'),
    borderActive: requireUiColor(theme, 'accent'),
    borderSubtle: requireUiColor(theme, 'bgHover'),
    diffAdded: requireUiColor(theme, 'diffAdd'),
    diffRemoved: requireUiColor(theme, 'diffDel'),
    diffContext: requireUiColor(theme, 'fgMuted'),
    diffHunkHeader: requireUiColor(theme, 'lineNr'),
    diffHighlightAdded: requireUiColor(theme, 'diffAddEmph'),
    diffHighlightRemoved: requireUiColor(theme, 'diffDelEmph'),
    diffLineNumber: requireUiColor(theme, 'lineNr'),
    diffAddedBg: requireUiColor(theme, 'bgFloat'),
    diffRemovedBg: requireUiColor(theme, 'bgFloat'),
    diffContextBg: requireUiColor(theme, 'bgFloat'),
    diffAddedLineNumberBg: requireUiColor(theme, 'bgHover'),
    diffRemovedLineNumberBg: requireUiColor(theme, 'bgHover'),
    markdownText: requireUiColor(theme, 'fg'),
    markdownHeading: requireSyntaxColor(theme, 'markupHeading'),
    markdownLink: requireSyntaxColor(theme, 'markupLink'),
    markdownLinkText: requireSyntaxColor(theme, 'markupLink'),
    markdownCode: requireSyntaxColor(theme, 'string'),
    markdownBlockQuote: requireUiColor(theme, 'fgMuted'),
    markdownEmph: requireUiColor(theme, 'fgDim'),
    markdownStrong: requireUiColor(theme, 'fg'),
    markdownHorizontalRule: requireUiColor(theme, 'border'),
    markdownListItem: requireSyntaxColor(theme, 'markupList'),
    markdownListEnumeration: requireSyntaxColor(theme, 'markupList'),
    markdownImage: requireSyntaxColor(theme, 'markupLink'),
    markdownImageText: requireSyntaxColor(theme, 'markupLink'),
    markdownCodeBlock: requireUiColor(theme, 'fg'),
    syntaxComment: requireUiColor(theme, 'comment'),
    syntaxKeyword: requireSyntaxColor(theme, 'keyword'),
    syntaxFunction: requireSyntaxColor(theme, 'func'),
    syntaxVariable: requireSyntaxColor(theme, 'variable'),
    syntaxString: requireSyntaxColor(theme, 'string'),
    syntaxNumber: requireSyntaxColor(theme, 'number'),
    syntaxType: requireSyntaxColor(theme, 'type'),
    syntaxOperator: requireSyntaxColor(theme, 'operator'),
    syntaxPunctuation: requireSyntaxColor(theme, 'punctuation'),
  };
  const mergedTheme: OpencodeThemeTokens = Object.assign(
    {},
    baseTheme,
    opencodeThemeOverrides(theme),
  );

  return {
    $schema: 'https://opencode.ai/theme.json',
    theme: mergedTheme,
  };
};
