import type { Theme } from '../theme-schema.ts';

/** The yazi theme file path, relative to HOME. */
export const yaziThemeRelPath = '.config/yazi/theme.toml';

type InlineValue = boolean | string | undefined;

type FiletypeRule = {
  readonly bold?: boolean;
  readonly fg?: string;
  readonly is?: string;
  readonly mime?: string;
  readonly url?: string;
};

type YaziStyle = {
  readonly bg?: string;
  readonly bold?: boolean;
  readonly fg?: string;
  readonly italic?: boolean;
};

const renderInlineValue = (value: boolean | string): string =>
  typeof value === 'boolean' ? String(value) : JSON.stringify(value);

const renderInlineTable = (
  fields: ReadonlyArray<readonly [string, InlineValue]>,
): string => {
  const parts: Array<string> = [];

  for (const field of fields) {
    if (field[1] !== undefined) {
      parts.push(`${field[0]} = ${renderInlineValue(field[1])}`);
    }
  }

  return `{ ${parts.join(', ')} }`;
};

const renderYaziStyle = (style: YaziStyle): string =>
  renderInlineTable([
    ['fg', style.fg],
    ['bg', style.bg],
    ['bold', style.bold],
    ['italic', style.italic],
  ]);

const renderFiletypeRule = (rule: FiletypeRule): string =>
  renderInlineTable([
    ['mime', rule.mime],
    ['url', rule.url],
    ['is', rule.is],
    ['fg', rule.fg],
    ['bold', rule.bold],
  ]);

const renderFiletypeRules = (theme: Theme): string => {
  const rules = [
    renderFiletypeRule({ mime: 'image/*', fg: theme.ui.accent }),
    renderFiletypeRule({
      mime: '{audio,video}/*',
      fg: theme.ui.warning,
    }),
    renderFiletypeRule({
      mime: 'application/{zip,gzip,x-tar,x-bzip2,x-7z-compressed,x-rar,xz}',
      fg: theme.ui.error,
    }),
    renderFiletypeRule({
      url: '*',
      is: 'orphan',
      fg: theme.ui.error,
      bold: true,
    }),
    renderFiletypeRule({ url: '*', is: 'exec', fg: theme.ui.success }),
    renderFiletypeRule({ url: '*', is: 'link', fg: theme.ui.info }),
    renderFiletypeRule({ url: '*', is: 'sock', fg: theme.ui.warning }),
    renderFiletypeRule({ url: '*', is: 'fifo', fg: theme.ui.warning }),
    renderFiletypeRule({ url: '*', is: 'block', fg: theme.ui.info }),
    renderFiletypeRule({ url: '*', is: 'char', fg: theme.ui.info }),
    renderFiletypeRule({ url: '*/', fg: theme.ui.info }),
  ];

  return ['rules = [', `  ${rules.join(',\n  ')}`, ']'].join('\n');
};

export const renderYaziTheme = (theme: Theme): string => {
  const ui = theme.ui;

  return [
    '[mgr]',
    `cwd             = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `find_keyword    = ${renderYaziStyle({ fg: ui.search, bold: true, italic: true })}`,
    `find_position   = ${renderYaziStyle({ fg: ui.search, bg: ui.bgVisual })}`,
    `symlink_target  = ${renderYaziStyle({ fg: ui.fgMuted, italic: true })}`,
    `marker_copied   = ${renderYaziStyle({ fg: ui.success, bg: ui.success })}`,
    `marker_cut      = ${renderYaziStyle({ fg: ui.error, bg: ui.error })}`,
    `marker_marked   = ${renderYaziStyle({ fg: ui.info, bg: ui.info })}`,
    `marker_selected = ${renderYaziStyle({ fg: ui.accent, bg: ui.accent })}`,
    `count_copied    = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.success })}`,
    `count_cut       = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.error })}`,
    `count_selected  = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.accent })}`,
    `border_style    = ${renderYaziStyle({ fg: ui.border })}`,
    '',
    '[tabs]',
    `active   = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.accent, bold: true })}`,
    `inactive = ${renderYaziStyle({ fg: ui.fgMuted, bg: ui.bgFloat })}`,
    '',
    '[mode]',
    `normal_main = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.accent, bold: true })}`,
    `normal_alt  = ${renderYaziStyle({ fg: ui.accent, bg: ui.bgFloat, bold: true })}`,
    `select_main = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.warning, bold: true })}`,
    `select_alt  = ${renderYaziStyle({ fg: ui.warning, bg: ui.bgFloat, bold: true })}`,
    `unset_main  = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.error, bold: true })}`,
    `unset_alt   = ${renderYaziStyle({ fg: ui.error, bg: ui.bgFloat, bold: true })}`,
    '',
    '[status]',
    `overall         = ${renderYaziStyle({ fg: ui.fg, bg: ui.bgFloat })}`,
    `perm_sep        = ${renderYaziStyle({ fg: ui.fgMuted })}`,
    `perm_type       = ${renderYaziStyle({ fg: ui.info })}`,
    `perm_read       = ${renderYaziStyle({ fg: ui.warning })}`,
    `perm_write      = ${renderYaziStyle({ fg: ui.error })}`,
    `perm_exec       = ${renderYaziStyle({ fg: ui.success })}`,
    `progress_label  = ${renderYaziStyle({ fg: ui.fg, bold: true })}`,
    `progress_normal = ${renderYaziStyle({ fg: ui.accent, bg: ui.bgFloat })}`,
    `progress_error  = ${renderYaziStyle({ fg: ui.error, bg: ui.bgFloat })}`,
    '',
    '[which]',
    `mask            = ${renderYaziStyle({ bg: ui.bgFloat })}`,
    `cand            = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `rest            = ${renderYaziStyle({ fg: ui.fgMuted })}`,
    `desc            = ${renderYaziStyle({ fg: ui.fg })}`,
    `separator_style = ${renderYaziStyle({ fg: ui.border })}`,
    '',
    '[confirm]',
    `border  = ${renderYaziStyle({ fg: ui.border })}`,
    `title   = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `body    = ${renderYaziStyle({ fg: ui.fg })}`,
    `list    = ${renderYaziStyle({ fg: ui.fgDim })}`,
    `btn_yes = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.accent, bold: true })}`,
    `btn_no  = ${renderYaziStyle({ fg: ui.fg })}`,
    '',
    '[spot]',
    `border   = ${renderYaziStyle({ fg: ui.border })}`,
    `title    = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `tbl_col  = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `tbl_cell = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.bgHover })}`,
    '',
    '[notify]',
    `title_info  = ${renderYaziStyle({ fg: ui.info })}`,
    `title_warn  = ${renderYaziStyle({ fg: ui.warning })}`,
    `title_error = ${renderYaziStyle({ fg: ui.error })}`,
    '',
    '[pick]',
    `border   = ${renderYaziStyle({ fg: ui.border })}`,
    `active   = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.accent, bold: true })}`,
    `inactive = ${renderYaziStyle({ fg: ui.fgDim })}`,
    '',
    '[input]',
    `border   = ${renderYaziStyle({ fg: ui.border })}`,
    `title    = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `value    = ${renderYaziStyle({ fg: ui.fg })}`,
    `selected = ${renderYaziStyle({ bg: ui.bgVisual })}`,
    '',
    '[cmp]',
    `border   = ${renderYaziStyle({ fg: ui.border })}`,
    `active   = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.accent, bold: true })}`,
    `inactive = ${renderYaziStyle({ fg: ui.fgDim })}`,
    '',
    '[tasks]',
    `border  = ${renderYaziStyle({ fg: ui.border })}`,
    `title   = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `hovered = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.bgHover })}`,
    '',
    '[help]',
    `border  = ${renderYaziStyle({ fg: ui.border })}`,
    `chord   = ${renderYaziStyle({ fg: ui.accent, bold: true })}`,
    `action  = ${renderYaziStyle({ fg: ui.fg })}`,
    `hovered = ${renderYaziStyle({ fg: ui.accentFg, bg: ui.bgHover })}`,
    '',
    '[filetype]',
    renderFiletypeRules(theme),
    '',
  ].join('\n');
};
