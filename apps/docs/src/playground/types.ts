import type { Theme } from '@otheme/core/schema';

export type ThemeValue = Theme;

export type PreviewPaneProps = { theme: ThemeValue };

export type EditorPaneProps = {
  theme: ThemeValue;
  onChange: (next: ThemeValue) => void;
};
