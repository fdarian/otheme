import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type { SyntaxColors, UiColors } from '@otheme/core/schema';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type {
  EditorPaneProps,
  PresetId,
  ThemeValue,
} from '#/components/playground/types';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import { ScrollArea } from '#/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Separator } from '#/components/ui/separator';
import { cn } from '#/lib/utils';
import targetsSchema from '../../../../../packages/core/theme.schema.json';

const TARGETS_SCHEMA_URI = 'otheme://theme/targets.json';
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const PRESET_LABELS: Record<PresetId, string> = {
  'atom-one-light': 'Atom One Light',
  claude: 'Claude',
  vesper: 'Vesper',
};

function fieldId(group: 'ui' | 'syntax', key: string) {
  return `${group}:${key}`;
}

function ToolbarLabel(props: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium text-muted-foreground">
      {props.children}
    </span>
  );
}

function ToolbarGroup(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', props.className)}>
      {props.children}
    </div>
  );
}

function ColorField(props: {
  flashing: boolean;
  label: string;
  onChange: (hex: string) => void;
  registerInput: (input: HTMLInputElement | null) => void;
  value: string;
}) {
  const [draft, setDraft] = useState(props.value);

  useEffect(() => {
    setDraft(props.value);
  }, [props.value]);

  function commit() {
    if (HEX_PATTERN.test(draft)) {
      props.onChange(draft);
      return;
    }

    setDraft(props.value);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-sm px-1.5 py-1 transition-colors',
        props.flashing && 'bg-muted',
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Pick color for ${props.label}`}
            className="size-6 shrink-0 rounded-sm border border-input shadow-sm"
            style={{ background: props.value }}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <div className="flex flex-col gap-3">
            <HexColorPicker color={props.value} onChange={props.onChange} />
            <div className="flex items-center justify-between gap-3 font-mono text-xs">
              <span className="text-muted-foreground">{props.label}</span>
              <span>{props.value}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="min-w-0 flex-1 font-mono text-sm text-muted-foreground">
        {props.label}
      </span>

      <Input
        ref={props.registerInput}
        className="h-8 w-28 font-mono text-xs"
        maxLength={7}
        value={draft}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit();
          }
        }}
      />
    </div>
  );
}

function ColorGroup<T extends Record<string, string>>(props: {
  colors: T;
  flashingKey: string | null;
  group: 'ui' | 'syntax';
  label: string;
  onChange: (updated: T) => void;
  registerInput: (id: string, input: HTMLInputElement | null) => void;
}) {
  function handleFieldChange(field: string, hex: string) {
    props.onChange({ ...props.colors, [field]: hex } as T);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground">
        {props.label}
      </h2>
      <div className="flex flex-col gap-1">
        {Object.keys(props.colors).map((field) => {
          const id = fieldId(props.group, field);

          return (
            <ColorField
              key={field}
              flashing={props.flashingKey === id}
              label={field}
              onChange={(hex) => handleFieldChange(field, hex)}
              registerInput={(input) => props.registerInput(id, input)}
              value={props.colors[field] as string}
            />
          );
        })}
      </div>
    </section>
  );
}

function TargetsEditor(props: {
  onChange: (updated: ThemeValue['targets']) => void;
  targets: ThemeValue['targets'];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(props.targets, null, 2),
  );
  const latestTextRef = useRef(jsonText);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const nextText = JSON.stringify(props.targets, null, 2);
    latestTextRef.current = nextText;
    setJsonText(nextText);
  }, [props.targets]);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    const model = editor.getModel();

    if (model === null) {
      throw new Error('Monaco editor model is null after mount');
    }

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [
        {
          fileMatch: [model.uri.toString()],
          schema: (targetsSchema as { properties: { targets: unknown } })
            .properties.targets,
          uri: TARGETS_SCHEMA_URI,
        },
      ],
      validate: true,
    });
  }, []);

  function handleChange(value: string | undefined) {
    if (value === undefined) {
      return;
    }

    latestTextRef.current = value;
    setJsonText(value);
  }

  function handleValidate(markers: { message: string }[]) {
    if (markers.length > 0) {
      return;
    }

    try {
      props.onChange(
        JSON.parse(latestTextRef.current) as ThemeValue['targets'],
      );
    } catch {
      // Monaco already surfaces parse diagnostics.
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground">
        Targets
      </h2>
      <div className="overflow-hidden rounded-md border bg-card">
        {isMounted ? (
          <MonacoEditor
            height="360px"
            language="json"
            options={{
              automaticLayout: true,
              fontSize: 12,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: 'on',
            }}
            theme="vs-dark"
            value={jsonText}
            onChange={handleChange}
            onMount={handleMount}
            onValidate={handleValidate}
          />
        ) : (
          <div className="h-[360px] bg-card" />
        )}
      </div>
    </section>
  );
}

export function EditorPane(props: EditorPaneProps) {
  const inputsRef = useRef(new Map<string, HTMLInputElement>());
  const [flashingKey, setFlashingKey] = useState<string | null>(null);
  const uiKeys = Object.keys(props.theme.ui) as (keyof UiColors)[];
  const syntaxKeys = Object.keys(props.theme.syntax) as (keyof SyntaxColors)[];

  function registerInput(id: string, input: HTMLInputElement | null) {
    if (input === null) {
      inputsRef.current.delete(id);
      return;
    }

    inputsRef.current.set(id, input);
  }

  useEffect(() => {
    if (props.focusField === null) {
      return;
    }

    const id = fieldId(props.focusField.group, props.focusField.key);
    const input = inputsRef.current.get(id);

    if (input === undefined) {
      return;
    }

    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
    input.select();
    setFlashingKey(id);

    const timeout = window.setTimeout(() => setFlashingKey(null), 1000);
    return () => window.clearTimeout(timeout);
  }, [props.focusField]);

  function handleUiChange(updated: UiColors) {
    props.onChange({ ...props.theme, ui: updated });
  }

  function handleSyntaxChange(updated: SyntaxColors) {
    props.onChange({ ...props.theme, syntax: updated });
  }

  function handleTargetsChange(updated: ThemeValue['targets']) {
    props.onChange({ ...props.theme, targets: updated });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="border-b bg-card px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <ToolbarGroup className="w-52">
            <ToolbarLabel>Preset</ToolbarLabel>
            <Select
              value={props.activePreset}
              onValueChange={(value) => props.onSelectPreset(value as PresetId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PRESET_LABELS) as [PresetId, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </ToolbarGroup>

          <ToolbarGroup className="w-44">
            <ToolbarLabel>Name</ToolbarLabel>
            <Input
              value={props.theme.name}
              onChange={(event) =>
                props.onChange({ ...props.theme, name: event.target.value })
              }
            />
          </ToolbarGroup>

          <ToolbarGroup className="min-w-[9.5rem]">
            <ToolbarLabel>Appearance</ToolbarLabel>
            <div className="flex h-9 rounded-md border bg-background p-1">
              {(['dark', 'light'] as const).map((appearance) => (
                <button
                  key={appearance}
                  type="button"
                  className={cn(
                    'flex-1 rounded-sm px-3 text-sm capitalize transition-colors',
                    props.theme.appearance === appearance
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground',
                  )}
                  onClick={() => props.onChange({ ...props.theme, appearance })}
                >
                  {appearance}
                </button>
              ))}
            </div>
          </ToolbarGroup>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={props.onReset}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button size="sm" variant="outline" onClick={props.onCopyJson}>
              <Copy className="size-3.5" />
              Copy JSON
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-4 py-4">
          <ColorGroup<UiColors>
            colors={
              Object.fromEntries(
                uiKeys.map((key) => [key, props.theme.ui[key]]),
              ) as UiColors
            }
            flashingKey={flashingKey}
            group="ui"
            label={`UI (${uiKeys.length})`}
            onChange={handleUiChange}
            registerInput={registerInput}
          />

          <Separator />

          <ColorGroup<SyntaxColors>
            colors={
              Object.fromEntries(
                syntaxKeys.map((key) => [key, props.theme.syntax[key]]),
              ) as SyntaxColors
            }
            flashingKey={flashingKey}
            group="syntax"
            label={`Syntax (${syntaxKeys.length})`}
            onChange={handleSyntaxChange}
            registerInput={registerInput}
          />

          <Separator />

          <TargetsEditor
            targets={props.theme.targets}
            onChange={handleTargetsChange}
          />

          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Check className="size-3.5" />
            Preview updates only after the targets JSON validates.
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
