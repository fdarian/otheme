import type { Theme } from '@otheme/core/schema';

export type ThemeValue = Theme;

export type BuiltinPresetId = 'vesper' | 'claude' | 'atom-one-light';

export type PresetId = string;

export type Preset = {
  id: PresetId;
  builtIn: boolean;
  initialTheme: ThemeValue;
  theme: ThemeValue;
};

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
  canRemovePreset: boolean;
  focusField: PaletteField | null;
  onAddPreset: (theme: ThemeValue) => void;
  onChange: (next: ThemeValue) => void;
  onCopyJson: () => void;
  onCreateBlankPreset: () => void;
  onRemovePreset: () => void;
  onReset: () => void;
  onSelectPreset: (preset: PresetId) => void;
  presets: Preset[];
  theme: ThemeValue;
};
