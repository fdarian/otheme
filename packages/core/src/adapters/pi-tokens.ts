// Authoritative pi theme token set from pi's TUI theme schema.
// `thinkingMax` is intentionally excluded: it is optional in pi's schema and
// falls back to `thinkingXhigh` when omitted.
export const piThemeTokens = [
  // Core UI
  'accent',
  'border',
  'borderAccent',
  'borderMuted',
  'success',
  'error',
  'warning',
  'muted',
  'dim',
  'text',
  'thinkingText',
  // Backgrounds & content
  'selectedBg',
  'userMessageBg',
  'userMessageText',
  'customMessageBg',
  'customMessageText',
  'customMessageLabel',
  'toolPendingBg',
  'toolSuccessBg',
  'toolErrorBg',
  'toolTitle',
  'toolOutput',
  // Markdown
  'mdHeading',
  'mdLink',
  'mdLinkUrl',
  'mdCode',
  'mdCodeBlock',
  'mdCodeBlockBorder',
  'mdQuote',
  'mdQuoteBorder',
  'mdHr',
  'mdListBullet',
  // Tool diffs
  'toolDiffAdded',
  'toolDiffRemoved',
  'toolDiffContext',
  // Syntax
  'syntaxComment',
  'syntaxKeyword',
  'syntaxFunction',
  'syntaxVariable',
  'syntaxString',
  'syntaxNumber',
  'syntaxType',
  'syntaxOperator',
  'syntaxPunctuation',
  // Thinking gradient (escalation ramp)
  'thinkingOff',
  'thinkingMinimal',
  'thinkingLow',
  'thinkingMedium',
  'thinkingHigh',
  'thinkingXhigh',
  // Bash mode
  'bashMode',
] as const;

export type PiThemeToken = (typeof piThemeTokens)[number];
