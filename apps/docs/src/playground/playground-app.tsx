'use client';

import atomOneLightJson from '@otheme/core/themes/atom-one-light.json';
import claudeJson from '@otheme/core/themes/claude.json';
import vesperJson from '@otheme/core/themes/vesper.json';
import { useState } from 'react';
import { EditorPane } from './editor-pane';
import { PreviewPane } from './preview-pane';
import type { ThemeValue } from './types';

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
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>Preset:</span>
        {(Object.keys(PRESETS) as PresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => handlePresetChange(id)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              background: activePreset === id ? '#111827' : '#fff',
              color: activePreset === id ? '#fff' : '#111827',
              cursor: 'pointer',
              fontWeight: activePreset === id ? 600 : 400,
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
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
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
        <div style={{ borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
          <EditorPane theme={theme} onChange={setTheme} />
        </div>
        <div style={{ overflow: 'auto' }}>
          <PreviewPane theme={theme} />
        </div>
      </div>
    </div>
  );
}
