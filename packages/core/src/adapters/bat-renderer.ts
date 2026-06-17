import type { Theme } from '../theme-schema.ts';

/** The generated bat/TextMate theme name, shared with delta's syntax-theme. */
export const batThemeName = (theme: Theme): string => `otheme-${theme.id}`;

/** The bat theme file path, relative to HOME. */
export const batThemeRelPath = (theme: Theme): string =>
  `.config/bat/themes/${batThemeName(theme)}.tmTheme`;

/** The bat config file path, relative to HOME. */
export const batConfigRelPath = '.config/bat/config';

type ScopeRule = {
  /** Human-readable name shown in the tmTheme settings entry. */
  readonly name: string;
  /** Comma-separated TextMate scope selectors this rule targets. */
  readonly scope: string;
  /** Foreground color for the matched scopes. */
  readonly foreground: string;
};

/**
 * Maps the shared palette to TextMate scope rules. Mirrors the semantic token
 * mapping in nvim-renderer.ts, retargeted from Treesitter groups to TextMate
 * scope selectors so syntax highlighting matches the active otheme theme.
 */
const scopeRules = (theme: Theme): ReadonlyArray<ScopeRule> => {
  const ui = theme.ui;
  const s = theme.syntax;

  return [
    { name: 'Comment', scope: 'comment', foreground: ui.comment },
    { name: 'Keyword', scope: 'keyword', foreground: s.keyword },
    { name: 'Operator', scope: 'keyword.operator', foreground: s.operator },
    { name: 'String', scope: 'string', foreground: s.string },
    {
      name: 'String escape',
      scope: 'constant.character.escape',
      foreground: s.stringEscape,
    },
    {
      name: 'String special',
      scope: 'string.regexp,string.other',
      foreground: s.stringSpecial,
    },
    {
      name: 'Function',
      scope: 'entity.name.function,support.function',
      foreground: s.func,
    },
    {
      name: 'Type',
      scope: 'entity.name.type,storage.type,support.type',
      foreground: s.type,
    },
    {
      name: 'Constant',
      scope: 'constant.language,support.constant',
      foreground: s.constant,
    },
    { name: 'Number', scope: 'constant.numeric', foreground: s.number },
    { name: 'Punctuation', scope: 'punctuation', foreground: s.punctuation },
    {
      name: 'Punctuation special',
      scope: 'punctuation.special,punctuation.definition',
      foreground: s.punctuationSpecial,
    },
    { name: 'Variable', scope: 'variable', foreground: s.variable },
    {
      name: 'Variable builtin',
      scope: 'variable.language',
      foreground: s.variableBuiltin,
    },
    {
      name: 'Variable member',
      scope: 'variable.other.member,meta.object-literal.key',
      foreground: s.variableMember,
    },
    { name: 'Tag', scope: 'entity.name.tag', foreground: s.tag },
    {
      name: 'Attribute',
      scope: 'entity.other.attribute-name',
      foreground: s.attribute,
    },
    {
      name: 'Markup heading',
      scope: 'markup.heading',
      foreground: s.markupHeading,
    },
    {
      name: 'Markup link',
      scope: 'markup.underline.link,string.other.link',
      foreground: s.markupLink,
    },
    { name: 'Markup list', scope: 'markup.list', foreground: s.markupList },
  ];
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const settingsEntry = (rule: ScopeRule): string =>
  [
    '\t\t<dict>',
    `\t\t\t<key>name</key>`,
    `\t\t\t<string>${escapeXml(rule.name)}</string>`,
    `\t\t\t<key>scope</key>`,
    `\t\t\t<string>${escapeXml(rule.scope)}</string>`,
    `\t\t\t<key>settings</key>`,
    `\t\t\t<dict>`,
    `\t\t\t\t<key>foreground</key>`,
    `\t\t\t\t<string>${rule.foreground}</string>`,
    `\t\t\t</dict>`,
    '\t\t</dict>',
  ].join('\n');

/**
 * Renders a TextMate `.tmTheme` (XML plist) derived from the theme palette.
 * bat uses this for syntax highlighting; delta delegates highlighting to bat,
 * so this is what makes diff token colors match the active otheme theme.
 */
export const renderBatTheme = (theme: Theme): string => {
  const globalEntry = [
    '\t\t<dict>',
    '\t\t\t<key>settings</key>',
    '\t\t\t<dict>',
    '\t\t\t\t<key>background</key>',
    `\t\t\t\t<string>${theme.ui.bg}</string>`,
    '\t\t\t\t<key>foreground</key>',
    `\t\t\t\t<string>${theme.ui.fg}</string>`,
    '\t\t\t</dict>',
    '\t\t</dict>',
  ].join('\n');

  const entries = [globalEntry, ...scopeRules(theme).map(settingsEntry)].join(
    '\n',
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '\t<key>name</key>',
    `\t<string>${escapeXml(batThemeName(theme))}</string>`,
    '\t<key>settings</key>',
    '\t<array>',
    entries,
    '\t</array>',
    '</dict>',
    '</plist>',
    '',
  ].join('\n');
};

const themeFlag = (theme: Theme): string => `--theme="${batThemeName(theme)}"`;

const themeFlagPattern = /^--theme=.*$/m;

/**
 * Sets the `--theme="otheme-<id>"` line in bat's config, replacing any existing
 * `--theme` line so otheme stays the active syntax theme across runs.
 */
export const updateBatConfig = (content: string, theme: Theme): string => {
  const replacement = themeFlag(theme);

  if (themeFlagPattern.test(content)) {
    return content.replace(themeFlagPattern, replacement);
  }

  const separator = content.length === 0 || content.endsWith('\n') ? '' : '\n';

  return `${content}${separator}${replacement}\n`;
};
