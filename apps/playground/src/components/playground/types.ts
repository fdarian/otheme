import type { Theme } from '@otheme/core/schema';

export type ThemeValue = Theme;

export type PresetId = 'vesper' | 'claude' | 'atom-one-light';

export type PaletteField = {
  group: 'ui' | 'syntax';
  key: string;
};

export type PreviewPaneProps = {
  theme: ThemeValue;
  inspectMode: boolean;
  onInspect: (field: PaletteField) => void;
  onToggleInspect: () => void;
};

export type EditorPaneProps = {
  activePreset: PresetId;
  focusField: PaletteField | null;
  onChange: (next: ThemeValue) => void;
  onCopyJson: () => void;
  onReset: () => void;
  onSelectPreset: (preset: PresetId) => void;
  theme: ThemeValue;
};
