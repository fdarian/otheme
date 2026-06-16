import type { NvimTarget, Theme } from '../theme-schema.ts';

type Opts = Record<string, string | boolean>;
type Group = readonly [group: string, opts: Opts];

/**
 * Canonical highlight scheme ported from the previous theme generator.
 */
function groups(theme: Theme, target: NvimTarget): Group[] {
  const ui = theme.ui;
  const s = theme.syntax;
  const bg = target.transparentBg ? 'NONE' : ui.bg;

  return [
    ['Normal', { fg: ui.fg, bg }],
    ['NormalFloat', { fg: ui.fg, bg: ui.bgFloat }],
    ['Visual', { bg: ui.bgVisual }],
    ['CursorLine', { bg: 'NONE' }],
    ['CursorColumn', { bg: ui.bgHover }],
    ['LineNr', { fg: ui.lineNr }],
    ['CursorLineNr', { fg: ui.fg }],
    ['SignColumn', { bg }],
    ['FoldColumn', { fg: ui.lineNr, bg }],
    ['EndOfBuffer', { fg: bg }],
    ['NonText', { fg: ui.lineNr }],
    ['StatusLine', { fg: ui.fgMuted, bg }],
    ['StatusLineNC', { fg: ui.fgDim, bg }],
    ['WinSeparator', { fg: ui.border }],
    ['VertSplit', { fg: ui.border }],
    ['TabLine', { fg: ui.fgDim, bg: 'NONE' }],
    ['TabLineFill', { bg: 'NONE' }],
    ['TabLineSel', { fg: ui.fg, bg: ui.bgHover }],
    ['Pmenu', { fg: ui.fg, bg: ui.bgFloat }],
    ['PmenuSel', { bg: ui.bgHover }],
    ['PmenuSbar', { bg: ui.bgFloat }],
    ['PmenuThumb', { bg: ui.fgDim }],
    ['FloatBorder', { fg: ui.border, bg: 'NONE' }],
    ['FloatTitle', { fg: ui.fgMuted, bg: 'NONE' }],
    ['Search', { bg: ui.search }],
    ['IncSearch', { fg: ui.bg, bg: ui.accent }],
    ['CurSearch', { fg: ui.bg, bg: ui.accent }],
    ['Substitute', { fg: ui.bg, bg: ui.accent }],
    ['WarningMsg', { fg: ui.warning }],
    ['ErrorMsg', { fg: ui.error }],
    ['ModeMsg', { fg: ui.fgMuted }],
    ['MoreMsg', { fg: ui.accent }],
    ['Question', { fg: ui.accent }],
    ['Conceal', { fg: ui.fgDim }],
    ['SpecialKey', { fg: ui.fgDim }],
    ['Whitespace', { fg: ui.lineNr }],
    ['Title', { fg: s.markupHeading, bold: true }],
    ['Directory', { fg: ui.fgMuted }],
    ['WildMenu', { fg: ui.fg, bg: ui.bgHover }],
    ['Folded', { fg: ui.comment, bg: 'NONE' }],
    ['MatchParen', { fg: ui.accent, bold: true }],
    ['WinBar', { fg: ui.fgMuted, bg }],
    ['WinBarNC', { fg: ui.fgDim, bg }],

    ['Comment', { fg: ui.comment }],
    ['SpecialComment', { fg: ui.comment }],
    ['String', { fg: s.string }],
    ['Character', { fg: s.string }],
    ['Number', { fg: s.number }],
    ['Boolean', { fg: s.number }],
    ['Float', { fg: s.number }],
    ['Constant', { fg: s.constant }],
    ['Function', { fg: s.func }],
    ['Identifier', { fg: ui.fg }],
    ['Statement', { fg: s.keyword }],
    ['Conditional', { fg: s.keyword }],
    ['Repeat', { fg: s.keyword }],
    ['Keyword', { fg: s.keyword }],
    ['Operator', { fg: s.operator }],
    ['Exception', { fg: s.keyword }],
    ['Label', { fg: s.tag }],
    ['PreProc', { fg: s.keyword }],
    ['Include', { fg: s.keyword }],
    ['Define', { fg: s.keyword }],
    ['Macro', { fg: s.keyword }],
    ['Type', { fg: s.type }],
    ['StorageClass', { fg: s.type }],
    ['Structure', { fg: s.type }],
    ['Typedef', { fg: s.type }],
    ['Special', { fg: ui.fgMuted }],
    ['SpecialChar', { fg: ui.fgMuted }],
    ['Tag', { fg: s.tag }],
    ['Delimiter', { fg: s.punctuation }],
    ['Error', { fg: ui.error }],
    ['Todo', { fg: s.tag }],

    ['@variable', { fg: s.variable }],
    ['@variable.builtin', { fg: s.variableBuiltin }],
    ['@variable.parameter', { fg: s.variable }],
    ['@variable.member', { fg: s.variableMember }],
    ['@function', { fg: s.func }],
    ['@function.builtin', { fg: s.func }],
    ['@function.call', { fg: s.func }],
    ['@function.method', { fg: s.func }],
    ['@function.method.call', { fg: s.func }],
    ['@constructor', { fg: s.func }],
    ['@keyword', { fg: s.keyword }],
    ['@keyword.function', { fg: s.keyword }],
    ['@keyword.return', { fg: s.keyword }],
    ['@keyword.operator', { fg: s.keyword }],
    ['@keyword.import', { fg: s.keyword }],
    ['@keyword.conditional', { fg: s.keyword }],
    ['@keyword.repeat', { fg: s.keyword }],
    ['@keyword.exception', { fg: s.keyword }],
    ['@operator', { fg: s.operator }],
    ['@punctuation.delimiter', { fg: s.punctuation }],
    ['@punctuation.bracket', { fg: s.punctuation }],
    ['@punctuation.special', { fg: s.punctuationSpecial }],
    ['@type', { fg: s.type }],
    ['@type.builtin', { fg: s.type }],
    ['@type.definition', { fg: s.type }],
    ['@attribute', { fg: s.attribute }],
    ['@string', { fg: s.string }],
    ['@string.escape', { fg: s.stringEscape }],
    ['@string.special', { fg: s.stringSpecial }],
    ['@string.regex', { fg: s.stringSpecial }],
    ['@character', { fg: s.string }],
    ['@constant', { fg: s.constant }],
    ['@constant.builtin', { fg: s.constant }],
    ['@number', { fg: s.number }],
    ['@number.float', { fg: s.number }],
    ['@boolean', { fg: s.number }],
    ['@comment', { fg: ui.comment }],
    ['@markup.heading', { fg: s.markupHeading, bold: true }],
    ['@markup.strong', { fg: ui.fg, bold: true }],
    ['@markup.italic', { fg: ui.fg, italic: true }],
    ['@markup.link', { fg: s.markupLink }],
    ['@markup.raw', { fg: s.string }],
    ['@markup.list', { fg: s.markupList }],
    ['@tag', { fg: s.tag }],
    ['@tag.attribute', { fg: s.attribute }],
    ['@tag.delimiter', { fg: ui.fgMuted }],
    ['@label', { fg: s.tag }],
    ['@module', { fg: s.variable }],

    ['@lsp.type.variable', {}],
    ['@lsp.type.property', { link: '@variable.member' }],
    ['@lsp.type.parameter', { link: '@variable.parameter' }],
    ['@lsp.type.function', { link: '@function' }],
    ['@lsp.type.method', { link: '@function.method' }],
    ['@lsp.type.keyword', { link: '@keyword' }],
    ['@lsp.type.comment', { link: '@comment' }],
    ['@lsp.type.string', { link: '@string' }],
    ['@lsp.type.number', { link: '@number' }],
    ['@lsp.type.type', { link: '@type' }],
    ['@lsp.type.class', { link: '@type' }],
    ['@lsp.type.interface', { link: '@type' }],
    ['@lsp.type.enum', { link: '@type' }],
    ['@lsp.type.enumMember', { link: '@constant' }],
    ['@lsp.type.namespace', { link: '@module' }],
    ['@lsp.type.macro', { link: '@constant' }],
    ['@lsp.type.decorator', { link: '@attribute' }],
    ['@lsp.type.operator', { link: '@operator' }],
    ['@lsp.mod.defaultLibrary', { link: '@function.builtin' }],
    ['@lsp.mod.deprecated', { strikethrough: true }],

    ['DiagnosticError', { fg: ui.error }],
    ['DiagnosticWarn', { fg: ui.warning }],
    ['DiagnosticInfo', { fg: ui.info }],
    ['DiagnosticHint', { fg: ui.hint }],
    ['DiagnosticUnderlineError', { undercurl: true, sp: ui.error }],
    ['DiagnosticUnderlineWarn', {}],
    ['DiagnosticUnderlineInfo', {}],
    ['DiagnosticUnderlineHint', {}],
    ['DiagnosticVirtualTextError', { fg: ui.error }],
    ['DiagnosticVirtualTextWarn', { fg: ui.warning }],
    ['DiagnosticVirtualTextInfo', { fg: ui.info }],
    ['DiagnosticVirtualTextHint', { fg: ui.hint }],
    ['DiagnosticUnnecessary', { fg: ui.fgDim }],
    ['DiagnosticSignError', { fg: ui.error }],
    ['DiagnosticSignWarn', { fg: ui.warning }],
    ['DiagnosticSignInfo', { fg: ui.info }],
    ['DiagnosticSignHint', { fg: ui.hint }],
    ['LspReferenceText', {}],
    ['LspReferenceRead', {}],
    ['LspReferenceWrite', {}],
    ['LspSignatureActiveParameter', { underline: true }],
    ['LspInlayHint', { fg: ui.comment, bg: 'NONE' }],

    ['DiffAdd', { bg: ui.diffAdd }],
    ['DiffChange', { bg: ui.diffChg }],
    ['DiffDelete', { bg: ui.diffDel }],
    ['DiffText', { bg: ui.diffChg }],
    ['GitSignsAdd', { fg: ui.success }],
    ['GitSignsChange', { fg: ui.warning }],
    ['GitSignsDelete', { fg: ui.error }],
    ['GitSignsCurrentLineBlame', { fg: ui.comment }],

    ['NoiceCmdlinePopupBorder', { fg: ui.border, bg: 'NONE' }],
    ['NoiceCmdlinePopupTitle', { fg: ui.fgMuted, bg: 'NONE' }],
    ['NoicePopupBorder', { fg: ui.border, bg: 'NONE' }],
    ['NoiceConfirmBorder', { fg: ui.border, bg: 'NONE' }],
    ['NoiceCursor', { fg: ui.bg, bg: ui.accent }],
    ['NoiceCmdlineIcon', { fg: ui.accent }],
    ['NoiceCmdlineIconSearch', { fg: ui.accent }],
    ['NoiceCmdlinePopupBorderSearch', { fg: ui.border, bg: 'NONE' }],
    ['NoiceCmdlinePopupTitleSearch', { fg: ui.fgMuted, bg: 'NONE' }],

    ['SnacksInputBorder', { fg: ui.border, bg: 'NONE' }],
    ['SnacksInputTitle', { fg: ui.fgMuted, bg: 'NONE' }],
    ['SnacksPickerBorder', { fg: ui.border, bg: 'NONE' }],

    ['TroubleNormal', { bg: 'NONE' }],
    ['TroubleNormalNC', { bg: 'NONE' }],

    ['GlanceBorderTop', { fg: ui.border }],
    ['GlancePreviewBorderBottom', { fg: ui.border }],
    ['GlanceListBorderBottom', { fg: ui.border }],

    ['TelescopeBorder', { fg: ui.border }],
    ['TelescopeSelection', { bg: ui.bgHover }],
    ['TelescopeMatching', { fg: ui.accent }],

    ['FidgetTitle', { fg: ui.accent }],
    ['FidgetTask', { fg: ui.comment }],
  ];
}

function renderOpts(opts: Opts): string {
  const entries = Object.entries(opts);

  if (entries.length === 0) {
    return '{}';
  }

  const fields: Array<string> = [];

  for (const entry of entries) {
    const key = entry[0];
    const value = entry[1];
    const field =
      typeof value === 'boolean' ? `${key} = ${value}` : `${key} = "${value}"`;
    fields.push(field);
  }

  return `{ ${fields.join(', ')} }`;
}

export function renderNvim(theme: Theme, target: NvimTarget): string {
  const lines: Array<string> = [];

  for (const group of groups(theme, target)) {
    lines.push(`hl("${group[0]}", ${renderOpts(group[1])})`);
  }

  return `vim.cmd("hi clear")
if vim.fn.exists("syntax_on") then
  vim.cmd("syntax reset")
end
vim.g.colors_name = "${target.colorscheme}"
vim.o.termguicolors = true
vim.o.background = "${theme.appearance}"

local function hl(group, opts)
  vim.api.nvim_set_hl(0, group, opts)
end

${lines.join('\n')}
`;
}
