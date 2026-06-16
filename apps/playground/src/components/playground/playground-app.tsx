import atomOneLightJson from '@otheme/core/themes/atom-one-light.json';
import claudeJson from '@otheme/core/themes/claude.json';
import vesperJson from '@otheme/core/themes/vesper.json';
import { useState } from 'react';

import { EditorPane } from '#/components/playground/editor-pane';
import { PreviewPane } from '#/components/playground/preview-pane';
import type {
  BuiltinPresetId,
  PaletteField,
  Preset,
  PresetId,
  ThemeValue,
} from '#/components/playground/types';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable';

const BUILTIN_THEMES: Record<BuiltinPresetId, ThemeValue> = {
  'atom-one-light': atomOneLightJson as ThemeValue,
  claude: claudeJson as ThemeValue,
  vesper: vesperJson as ThemeValue,
};

const BUILTIN_PRESET_ORDER: BuiltinPresetId[] = [
  'vesper',
  'claude',
  'atom-one-light',
];
const DEFAULT_PRESET: BuiltinPresetId = 'vesper';

function cloneTheme(theme: ThemeValue): ThemeValue {
  return structuredClone(theme);
}

function createPresetRecord(
  id: PresetId,
  theme: ThemeValue,
  builtIn: boolean,
): Preset {
  const clonedTheme = cloneTheme(theme);
  return {
    builtIn,
    id,
    initialTheme: cloneTheme(clonedTheme),
    theme: clonedTheme,
  };
}

function createInitialPresets() {
  return BUILTIN_PRESET_ORDER.map((id) =>
    createPresetRecord(id, BUILTIN_THEMES[id], true),
  );
}

function makeUniquePresetId(baseId: string, presets: Preset[]) {
  const normalizedBase = baseId.trim().toLowerCase() || 'preset';
  const existingIds = new Set(presets.map((preset) => preset.id));

  if (!existingIds.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  while (existingIds.has(`${normalizedBase}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalizedBase}-${suffix}`;
}

function findPreset(presets: Preset[], presetId: PresetId) {
  const preset = presets.find((candidate) => candidate.id === presetId);

  if (preset !== undefined) {
    return preset;
  }

  const fallbackPreset = presets[0];
  if (fallbackPreset === undefined) {
    throw new Error('Playground preset list is empty.');
  }

  return fallbackPreset;
}

export function PlaygroundApp() {
  const [presets, setPresets] = useState<Preset[]>(createInitialPresets);
  const [activePreset, setActivePreset] = useState<PresetId>(DEFAULT_PRESET);
  const [focusField, setFocusField] = useState<PaletteField | null>(null);
  const [inspectMode, setInspectMode] = useState(false);
  const selectedPreset = findPreset(presets, activePreset);
  const theme = selectedPreset.theme;

  function handlePresetChange(preset: PresetId) {
    setActivePreset(preset);
  }

  function handleThemeChange(nextTheme: ThemeValue) {
    setPresets((current) =>
      current.map((preset) =>
        preset.id === activePreset
          ? { ...preset, theme: cloneTheme(nextTheme) }
          : preset,
      ),
    );
  }

  function handleReset() {
    setPresets((current) =>
      current.map((preset) =>
        preset.id === activePreset
          ? { ...preset, theme: cloneTheme(preset.initialTheme) }
          : preset,
      ),
    );
  }

  function handleCopyJson() {
    void navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
  }

  function handleCreateBlankPreset() {
    const blankSeed =
      selectedPreset.builtIn === true
        ? selectedPreset.initialTheme
        : BUILTIN_THEMES[DEFAULT_PRESET];
    const nextPresetId = makeUniquePresetId('untitled', presets);
    const nextTheme = {
      ...cloneTheme(blankSeed),
      id: nextPresetId,
      name: 'Untitled',
    };

    setPresets((current) => [
      ...current,
      createPresetRecord(nextPresetId, nextTheme, false),
    ]);
    setActivePreset(nextPresetId);
  }

  function handleAddPreset(nextTheme: ThemeValue) {
    const nextPresetId = makeUniquePresetId(nextTheme.id, presets);
    const themeWithPresetId = {
      ...cloneTheme(nextTheme),
      id: nextPresetId,
    };

    setPresets((current) => [
      ...current,
      createPresetRecord(nextPresetId, themeWithPresetId, false),
    ]);
    setActivePreset(nextPresetId);
  }

  function handleRemovePreset() {
    if (selectedPreset.builtIn) {
      return;
    }

    setPresets((current) =>
      current.filter((preset) => preset.id !== selectedPreset.id),
    );
    setActivePreset(DEFAULT_PRESET);
  }

  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50} minSize={28}>
          <EditorPane
            activePreset={activePreset}
            canRemovePreset={selectedPreset.builtIn === false}
            focusField={focusField}
            onAddPreset={handleAddPreset}
            onChange={handleThemeChange}
            onCopyJson={handleCopyJson}
            onCreateBlankPreset={handleCreateBlankPreset}
            onRemovePreset={handleRemovePreset}
            onReset={handleReset}
            onSelectPreset={handlePresetChange}
            presets={presets}
            theme={theme}
          />
        </ResizablePanel>
        <ResizableHandle className="bg-border/80 after:w-[3px] hover:after:bg-muted-foreground/40" />
        <ResizablePanel defaultSize={50} minSize={28}>
          <PreviewPane
            inspectMode={inspectMode}
            onInspect={setFocusField}
            onToggleInspect={() => setInspectMode((previous) => !previous)}
            theme={theme}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
