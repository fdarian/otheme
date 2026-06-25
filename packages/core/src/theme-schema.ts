import { Schema } from 'effect';
import {
  type OpencodeThemeToken,
  opencodeThemeTokens,
} from './adapters/opencode-tokens.ts';

export const HexColor = Schema.String.check(
  Schema.isPattern(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Expected a six-digit hex color like #A1B2C3',
  }),
);

export const UiColors = Schema.Struct({
  accent: HexColor,
  accentFg: HexColor,
  bg: HexColor,
  bgFloat: HexColor,
  bgHover: HexColor,
  bgVisual: HexColor,
  border: HexColor,
  comment: HexColor,
  diffAdd: HexColor,
  /** Within-line change emphasis background for added text (git-delta plus-emph). */
  diffAddEmph: HexColor,
  diffChg: HexColor,
  diffDel: HexColor,
  /** Within-line change emphasis background for removed text (git-delta minus-emph). */
  diffDelEmph: HexColor,
  error: HexColor,
  fg: HexColor,
  fgDim: HexColor,
  fgMuted: HexColor,
  hint: HexColor,
  info: HexColor,
  lineNr: HexColor,
  search: HexColor,
  success: HexColor,
  warning: HexColor,
});

export const SyntaxColors = Schema.Struct({
  attribute: HexColor,
  constant: HexColor,
  func: HexColor,
  keyword: HexColor,
  markupHeading: HexColor,
  markupLink: HexColor,
  markupList: HexColor,
  number: HexColor,
  operator: HexColor,
  punctuation: HexColor,
  punctuationSpecial: HexColor,
  string: HexColor,
  stringEscape: HexColor,
  stringSpecial: HexColor,
  tag: HexColor,
  type: HexColor,
  variable: HexColor,
  variableBuiltin: HexColor,
  variableMember: HexColor,
});

export const NvimTarget = Schema.Struct({
  colorscheme: Schema.String,
  transparentBg: Schema.Boolean,
});

export const TmuxTarget = Schema.Struct({
  inactiveFg: HexColor,
  muted: HexColor,
  searchCurrent: HexColor,
  searchMatch: HexColor,
  sessionFormatter: Schema.optional(Schema.String),
  statusRight: Schema.optional(Schema.String),
});

const GhosttyFontFields = {
  fontFamily: Schema.optional(Schema.String),
  fontThicken: Schema.optional(Schema.Boolean),
  fontThickenStrength: Schema.optional(Schema.Number),
};

export const GhosttyAuthorTarget = Schema.Struct({
  mode: Schema.Literal('author'),
  ...GhosttyFontFields,
});

export const GhosttyMapTarget = Schema.Struct({
  mapTo: Schema.String,
  mode: Schema.Literal('map'),
  ...GhosttyFontFields,
});

export const GhosttyTarget = Schema.Union([
  GhosttyAuthorTarget,
  GhosttyMapTarget,
]);

export const ClaudeCodeAuthorTarget = Schema.Struct({
  mode: Schema.Literal('author'),
});

export const ClaudeCodeMapTarget = Schema.Struct({
  mapTo: Schema.Literals(['dark', 'light']),
  mode: Schema.Literal('map'),
});

export const ClaudeCodeTarget = Schema.Union([
  ClaudeCodeAuthorTarget,
  ClaudeCodeMapTarget,
]);

export const GitDeltaTarget = Schema.Struct({
  features: Schema.String,
});

export const BatTarget = Schema.Struct({});

export const YaziTarget = Schema.Struct({});
const opencodeThemeOverrideFields: {
  readonly [K in OpencodeThemeToken]: Schema.optionalKey<typeof HexColor>;
} = Object.fromEntries(
  opencodeThemeTokens.map((token) => [token, Schema.optionalKey(HexColor)]),
) as {
  readonly [K in OpencodeThemeToken]: Schema.optionalKey<typeof HexColor>;
};

export const OpencodeThemeOverrides = Schema.Struct(
  opencodeThemeOverrideFields,
);

export const OpencodeTarget = Schema.Struct({
  overrides: Schema.optional(OpencodeThemeOverrides),
});

export const MacosTarget = Schema.Struct({});

export const Targets = Schema.Struct({
  bat: Schema.optional(BatTarget),
  'claude-code': Schema.optional(ClaudeCodeTarget),
  'git-delta': Schema.optional(GitDeltaTarget),
  ghostty: Schema.optional(GhosttyTarget),
  macos: Schema.optional(MacosTarget),
  nvim: Schema.optional(NvimTarget),
  opencode: Schema.optional(OpencodeTarget),
  tmux: Schema.optional(TmuxTarget),
  yazi: Schema.optional(YaziTarget),
});

export const Theme = Schema.Struct({
  appearance: Schema.Literals(['dark', 'light']),
  id: Schema.String,
  name: Schema.String,
  syntax: SyntaxColors,
  targets: Targets,
  ui: UiColors,
});

export type Appearance = Theme['appearance'];
export type BatTarget = typeof BatTarget.Type;
export type ClaudeCodeAuthorTarget = typeof ClaudeCodeAuthorTarget.Type;
export type ClaudeCodeMapTarget = typeof ClaudeCodeMapTarget.Type;
export type ClaudeCodeTarget = typeof ClaudeCodeTarget.Type;
export type GitDeltaTarget = typeof GitDeltaTarget.Type;
export type GhosttyAuthorTarget = typeof GhosttyAuthorTarget.Type;
export type GhosttyMapTarget = typeof GhosttyMapTarget.Type;
export type GhosttyTarget = typeof GhosttyTarget.Type;
export type MacosTarget = typeof MacosTarget.Type;
export type NvimTarget = typeof NvimTarget.Type;
export type OpencodeTarget = typeof OpencodeTarget.Type;
export type SyntaxColors = typeof SyntaxColors.Type;
export type TargetId = keyof typeof Targets.Type;
export type Theme = typeof Theme.Type;
export type TmuxTarget = typeof TmuxTarget.Type;
export type UiColors = typeof UiColors.Type;
export type YaziTarget = typeof YaziTarget.Type;
