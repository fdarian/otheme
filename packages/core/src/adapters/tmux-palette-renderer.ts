import type { Theme, TmuxPaletteAuthorTarget } from '../theme-schema.ts';

interface TmuxPaletteThemeDocument {
  readonly accent: string;
  readonly bg: string;
  readonly fg: string;
  readonly muted: string;
  readonly panel: string;
  readonly selected: string;
}

export const tmuxPaletteThemeName = (theme: Theme): string =>
  `otheme-${theme.id}`;

export const renderTmuxPaletteTheme = (
  theme: Theme,
  _target: TmuxPaletteAuthorTarget,
): string => {
  const document: TmuxPaletteThemeDocument = {
    accent: theme.ui.accent,
    bg: theme.ui.bg,
    fg: theme.ui.fg,
    muted: theme.ui.fgMuted,
    panel: theme.ui.bgFloat,
    selected: theme.ui.bgVisual,
  };

  return `${JSON.stringify(document, null, 2)}\n`;
};
