import type {
  GhosttyAuthorTarget,
  GhosttyTarget,
  Theme,
} from '../theme-schema.ts';

interface GhosttyManagedLine {
  readonly property: string;
  readonly value: string;
}

const formatBoolean = (value: boolean): string => (value ? 'true' : 'false');

const ansiPalette = (theme: Theme): ReadonlyArray<string> => [
  // ANSI slots 0-7: normal black/red/green/yellow/blue/magenta/cyan/white.
  // Use UI status roles for terminal control colors and syntax roles for code
  // colors so author mode carries the same semantic palette as nvim/tmux.
  theme.ui.bg,
  theme.ui.error,
  theme.ui.success,
  theme.ui.warning,
  theme.ui.info,
  theme.syntax.keyword,
  theme.syntax.type,
  theme.ui.fgMuted,
  // ANSI slots 8-15: bright variants. Use dim UI for bright black, then the
  // strongest related syntax/UI roles for high-intensity terminal colors.
  theme.ui.fgDim,
  theme.ui.error,
  theme.syntax.string,
  theme.ui.accent,
  theme.syntax.func,
  theme.syntax.markupHeading,
  theme.syntax.stringSpecial,
  theme.ui.fg,
];

export const ghosttyThemeName = (theme: Theme): string => `otheme-${theme.id}`;

export const renderGhosttyTheme = (
  theme: Theme,
  _target: GhosttyAuthorTarget,
): string => {
  const lines: Array<string> = [];
  const palette = ansiPalette(theme);

  for (let index = 0; index < palette.length; index += 1) {
    const color = palette[index];

    if (color !== undefined) {
      lines.push(`palette = ${index}=${color}`);
    }
  }

  lines.push(`background = ${theme.ui.bg}`);
  lines.push(`foreground = ${theme.ui.fg}`);
  lines.push(`cursor-color = ${theme.ui.accent}`);
  lines.push(`selection-background = ${theme.ui.bgVisual}`);
  lines.push(`selection-foreground = ${theme.ui.fg}`);

  return `${lines.join('\n')}\n`;
};

export const ghosttyManagedLines = (
  theme: Theme,
  target: GhosttyTarget,
): ReadonlyArray<GhosttyManagedLine> => {
  const lines: Array<GhosttyManagedLine> = [];
  const themeValue =
    target.mode === 'author' ? ghosttyThemeName(theme) : target.mapTo;

  lines.push({ property: 'theme', value: themeValue });

  if ('fontThicken' in target && target.fontThicken !== undefined) {
    lines.push({
      property: 'font-thicken',
      value: formatBoolean(target.fontThicken),
    });
  }

  if (
    'fontThickenStrength' in target &&
    target.fontThickenStrength !== undefined
  ) {
    lines.push({
      property: 'font-thicken-strength',
      value: String(target.fontThickenStrength),
    });
  }

  if ('fontFamily' in target && target.fontFamily !== undefined) {
    lines.push({ property: 'font-family', value: target.fontFamily });
  }

  return lines;
};

export const updateGhosttyConfig = (
  content: string,
  lines: ReadonlyArray<GhosttyManagedLine>,
): string => {
  let updated = content;

  for (const line of lines) {
    const replacement = `${line.property} = ${line.value}`;
    const pattern = new RegExp(`^\\s*${line.property}\\s*=.*$`, 'm');

    if (pattern.test(updated)) {
      updated = updated.replace(pattern, replacement);
    } else {
      const separator =
        updated.length === 0 || updated.endsWith('\n') ? '' : '\n';
      updated = `${updated}${separator}${replacement}\n`;
    }
  }

  return updated;
};
