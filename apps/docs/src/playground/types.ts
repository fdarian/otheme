import type { Theme } from '@otheme/core/schema';

export type ThemeValue = Theme;

export type PaletteField = { group: 'ui' | 'syntax'; key: string };

export type PreviewPaneProps = {
  theme: ThemeValue;
  inspectMode: boolean;
  onInspect: (field: PaletteField) => void;
  onToggleInspect: () => void;
};

export type EditorPaneProps = {
  theme: ThemeValue;
  onChange: (next: ThemeValue) => void;
  focusField: PaletteField | null;
};
