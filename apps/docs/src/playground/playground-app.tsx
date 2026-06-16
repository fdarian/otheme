'use client';

import atomOneLightJson from '@otheme/core/themes/atom-one-light.json';
import claudeJson from '@otheme/core/themes/claude.json';
import vesperJson from '@otheme/core/themes/vesper.json';
import { useState } from 'react';
import { EditorPane } from './editor-pane';
import { PreviewPane } from './preview-pane';
import type { PaletteField, ThemeValue } from './types';

type PresetId = 'vesper' | 'claude' | 'atom-one-light';

const PRESETS: Record<PresetId, ThemeValue> = {
  vesper: vesperJson as ThemeValue,
  claude: claudeJson as ThemeValue,
  'atom-one-light': atomOneLightJson as ThemeValue,
};

const PRESET_LABELS: Record<PresetId, string> = {
  vesper: 'Vesper',
  claude: 'Claude',
  'atom-one-light': 'Atom One Light',
};

const DEFAULT_PRESET: PresetId = 'vesper';

export function PlaygroundApp() {
  const [activePreset, setActivePreset] = useState<PresetId>(DEFAULT_PRESET);
  const [theme, setTheme] = useState<ThemeValue>(PRESETS[DEFAULT_PRESET]);
  const [focusField, setFocusField] = useState<PaletteField | null>(null);
  const [inspectMode, setInspectMode] = useState(false);

  function handlePresetChange(preset: PresetId) {
    setActivePreset(preset);
    setTheme(PRESETS[preset]);
  }

  function handleReset() {
    setTheme(PRESETS[activePreset]);
  }

  function handleCopyJson() {
    navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--vocs-background-color-primary)',
        fontFamily: 'var(--vocs-font-sans)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--vocs-border-color-primary)',
          background: 'var(--vocs-background-color-surface)',
          flexShrink: 0,
          fontFamily: 'var(--vocs-font-sans)',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: 'var(--vocs-text-color-primary)',
            marginRight: '0.25rem',
          }}
        >
          Preset:
        </span>
        {(Object.keys(PRESETS) as PresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => handlePresetChange(id)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--vocs-radius-md)',
              border: '1px solid var(--vocs-border-color-primary)',
              background:
                activePreset === id
                  ? 'var(--vocs-color-accent)'
                  : 'var(--vocs-background-color-primary)',
              color:
                activePreset === id
                  ? 'var(--vocs-color-accentInvert)'
                  : 'var(--vocs-text-color-primary)',
              cursor: 'pointer',
              fontWeight: activePreset === id ? 600 : 400,
              fontFamily: 'var(--vocs-font-sans)',
            }}
          >
            {PRESET_LABELS[id]}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--vocs-radius-md)',
              border: '1px solid var(--vocs-border-color-primary)',
              background: 'var(--vocs-background-color-primary)',
              color: 'var(--vocs-text-color-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--vocs-font-sans)',
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--vocs-radius-md)',
              border: '1px solid var(--vocs-border-color-primary)',
              background: 'var(--vocs-background-color-primary)',
              color: 'var(--vocs-text-color-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--vocs-font-sans)',
            }}
          >
            Copy JSON
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderRight: '1px solid var(--vocs-border-color-primary)',
            overflow: 'auto',
            background: 'var(--vocs-background-color-primary)',
          }}
        >
          <EditorPane
            theme={theme}
            onChange={setTheme}
            focusField={focusField}
          />
        </div>
        <div
          style={{
            overflow: 'auto',
            background: 'var(--vocs-background-color-surface)',
          }}
        >
          <PreviewPane
            theme={theme}
            inspectMode={inspectMode}
            onInspect={setFocusField}
            onToggleInspect={() => setInspectMode((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}
