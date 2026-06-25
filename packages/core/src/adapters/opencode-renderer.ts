import type { Theme } from '../theme-schema.ts';

interface OpencodeThemeTokens {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly error: string;
  readonly warning: string;
  readonly success: string;
  readonly info: string;
  readonly text: string;
  readonly textMuted: string;
  readonly background: string;
  readonly backgroundPanel: string;
  readonly backgroundElement: string;
  readonly border: string;
  readonly borderActive: string;
  readonly borderSubtle: string;
  readonly diffAdded: string;
  readonly diffRemoved: string;
  readonly diffContext: string;
  readonly diffHunkHeader: string;
  readonly diffHighlightAdded: string;
  readonly diffHighlightRemoved: string;
  readonly diffLineNumber: string;
  readonly diffAddedBg: string;
  readonly diffRemovedBg: string;
  readonly diffContextBg: string;
  readonly diffAddedLineNumberBg: string;
  readonly diffRemovedLineNumberBg: string;
  readonly markdownText: string;
  readonly markdownHeading: string;
  readonly markdownLink: string;
  readonly markdownLinkText: string;
  readonly markdownCode: string;
  readonly markdownBlockQuote: string;
  readonly markdownEmph: string;
  readonly markdownStrong: string;
  readonly markdownHorizontalRule: string;
  readonly markdownListItem: string;
  readonly markdownListEnumeration: string;
  readonly markdownImage: string;
  readonly markdownImageText: string;
  readonly markdownCodeBlock: string;
  readonly syntaxComment: string;
  readonly syntaxKeyword: string;
  readonly syntaxFunction: string;
  readonly syntaxVariable: string;
  readonly syntaxString: string;
  readonly syntaxNumber: string;
  readonly syntaxType: string;
  readonly syntaxOperator: string;
  readonly syntaxPunctuation: string;
}

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

export const renderOpencodeTheme = (theme: Theme): OpencodeThemeDocument => ({
  $schema: 'https://opencode.ai/theme.json',
  theme: {
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
  },
});
