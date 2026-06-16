import atomOneLightJson from '@otheme/core/themes/atom-one-light.json';
import claudeJson from '@otheme/core/themes/claude.json';
import vesperJson from '@otheme/core/themes/vesper.json';
import { useState } from 'react';

import { EditorPane } from '#/components/playground/editor-pane';
import { PreviewPane } from '#/components/playground/preview-pane';
import type {
  PaletteField,
  PresetId,
  ThemeValue,
} from '#/components/playground/types';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable';

const PRESETS: Record<PresetId, ThemeValue> = {
  'atom-one-light': atomOneLightJson as ThemeValue,
  claude: claudeJson as ThemeValue,
  vesper: vesperJson as ThemeValue,
};

const DEFAULT_PRESET: PresetId = 'vesper';

function cloneTheme(theme: ThemeValue): ThemeValue {
  return structuredClone(theme);
}

export function PlaygroundApp() {
  const [activePreset, setActivePreset] = useState<PresetId>(DEFAULT_PRESET);
  const [theme, setTheme] = useState<ThemeValue>(() =>
    cloneTheme(PRESETS[DEFAULT_PRESET]),
  );
  const [focusField, setFocusField] = useState<PaletteField | null>(null);
  const [inspectMode, setInspectMode] = useState(false);

  function handlePresetChange(preset: PresetId) {
    setActivePreset(preset);
    setTheme(cloneTheme(PRESETS[preset]));
  }

  function handleReset() {
    setTheme(cloneTheme(PRESETS[activePreset]));
  }

  function handleCopyJson() {
    void navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
  }

  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50} minSize={28}>
          <EditorPane
            activePreset={activePreset}
            focusField={focusField}
            onChange={setTheme}
            onCopyJson={handleCopyJson}
            onReset={handleReset}
            onSelectPreset={handlePresetChange}
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
