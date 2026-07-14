import type { Theme } from '../theme-schema.ts';
import type { PiThemeToken } from './pi-tokens.ts';

export interface PiThemeTokens extends Readonly<Record<PiThemeToken, string>> {}

export interface PiThemeDocument {
  readonly $schema: string;
  readonly colors: PiThemeTokens;
  readonly name: string;
}

const piThemeSchemaUrl =
  'https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json';

type UiColorToken = keyof Theme['ui'];
type SyntaxColorToken = keyof Theme['syntax'];

const requireUiColor = (theme: Theme, token: UiColorToken): string => {
  const value = theme.ui[token];

  if (value === undefined) {
    throw new Error(`pi renderer requires ui.${token} for theme ${theme.id}`);
  }

  return value;
};

const requireSyntaxColor = (theme: Theme, token: SyntaxColorToken): string => {
  const value = theme.syntax[token];

  if (value === undefined) {
    throw new Error(
      `pi renderer requires syntax.${token} for theme ${theme.id}`,
    );
  }

  return value;
};

const piThemeColors = (theme: Theme): PiThemeTokens => ({
  // Core UI
  accent: requireUiColor(theme, 'accent'),
  border: requireUiColor(theme, 'border'),
  borderAccent: requireUiColor(theme, 'accent'),
  borderMuted: requireUiColor(theme, 'lineNr'),
  success: requireUiColor(theme, 'success'),
  error: requireUiColor(theme, 'error'),
  warning: requireUiColor(theme, 'warning'),
  muted: requireUiColor(theme, 'fgMuted'),
  dim: requireUiColor(theme, 'fgDim'),
  text: requireUiColor(theme, 'fg'),
  thinkingText: requireUiColor(theme, 'comment'),
  // Backgrounds & content
  selectedBg: requireUiColor(theme, 'bgVisual'),
  userMessageBg: requireUiColor(theme, 'bgFloat'),
  userMessageText: requireUiColor(theme, 'fg'),
  customMessageBg: requireUiColor(theme, 'bgHover'),
  customMessageText: requireUiColor(theme, 'fg'),
  customMessageLabel: requireUiColor(theme, 'hint'),
  toolPendingBg: requireUiColor(theme, 'bgFloat'),
  toolSuccessBg: requireUiColor(theme, 'diffAdd'),
  toolErrorBg: requireUiColor(theme, 'diffDel'),
  toolTitle: requireUiColor(theme, 'fg'),
  toolOutput: requireUiColor(theme, 'fgMuted'),
  // Markdown
  mdHeading: requireSyntaxColor(theme, 'markupHeading'),
  mdLink: requireSyntaxColor(theme, 'markupLink'),
  mdLinkUrl: requireUiColor(theme, 'fgDim'),
  mdCode: requireUiColor(theme, 'accent'),
  mdCodeBlock: requireSyntaxColor(theme, 'string'),
  mdCodeBlockBorder: requireUiColor(theme, 'border'),
  mdQuote: requireUiColor(theme, 'fgMuted'),
  mdQuoteBorder: requireUiColor(theme, 'border'),
  mdHr: requireUiColor(theme, 'border'),
  mdListBullet: requireSyntaxColor(theme, 'markupList'),
  // Tool diffs
  toolDiffAdded: requireUiColor(theme, 'success'),
  toolDiffRemoved: requireUiColor(theme, 'error'),
  toolDiffContext: requireUiColor(theme, 'fgMuted'),
  // Syntax
  syntaxComment: requireUiColor(theme, 'comment'),
  syntaxKeyword: requireSyntaxColor(theme, 'keyword'),
  syntaxFunction: requireSyntaxColor(theme, 'func'),
  syntaxVariable: requireSyntaxColor(theme, 'variable'),
  syntaxString: requireSyntaxColor(theme, 'string'),
  syntaxNumber: requireSyntaxColor(theme, 'number'),
  syntaxType: requireSyntaxColor(theme, 'type'),
  syntaxOperator: requireSyntaxColor(theme, 'operator'),
  syntaxPunctuation: requireSyntaxColor(theme, 'punctuation'),
  // Thinking gradient (escalation ramp); thinkingMax is omitted and pi falls
  // back to thinkingXhigh.
  thinkingOff: requireUiColor(theme, 'fgDim'),
  thinkingMinimal: requireUiColor(theme, 'comment'),
  thinkingLow: requireUiColor(theme, 'info'),
  thinkingMedium: requireUiColor(theme, 'hint'),
  thinkingHigh: requireUiColor(theme, 'warning'),
  thinkingXhigh: requireUiColor(theme, 'accent'),
  // Bash mode
  bashMode: requireUiColor(theme, 'success'),
});

export const renderPiTheme = (theme: Theme): string => {
  const document: PiThemeDocument = {
    $schema: piThemeSchemaUrl,
    colors: piThemeColors(theme),
    name: theme.id,
  };

  return JSON.stringify(document, null, 2);
};
