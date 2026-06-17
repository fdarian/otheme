import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type { SyntaxColors, UiColors } from '@otheme/core/schema';
import {
  Check,
  Copy,
  Ellipsis,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import type {
  EditorPaneProps,
  Preset,
  ThemeValue,
} from '#/components/playground/types';
import {
  type ImportedTheme,
  importTheme,
  mapVscodeTheme,
  searchThemes,
  type ThemeSearchResult,
} from '#/components/playground/vscode-import';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '#/components/ui/menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover';
import { ScrollArea } from '#/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Separator } from '#/components/ui/separator';
import { cn } from '#/lib/utils';
import targetsSchema from '../../../../../packages/core/theme.schema.json';

const TARGETS_SCHEMA_URI = 'otheme://theme/targets.json';
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const DOWNLOAD_COUNT_FORMATTER = new Intl.NumberFormat();

function fieldId(group: 'ui' | 'syntax', key: string) {
  return `${group}:${key}`;
}

function presetLabel(preset: Preset) {
  return preset.theme.name.trim() || 'Untitled';
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

type DialogOpenChangeDetails = {
  preventUnmountOnClose(): void;
  reason: string;
};

function ImportErrorNotice(props: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {props.message}
    </div>
  );
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

function SearchResultButton(props: {
  disabled: boolean;
  onPressStart: () => void;
  onSelect: () => void;
  result: ThemeSearchResult;
}) {
  return (
    <button
      type="button"
      className="flex w-full flex-col gap-1 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      disabled={props.disabled}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          props.onPressStart();
        }
      }}
      onPointerDownCapture={props.onPressStart}
      onClick={props.onSelect}
    >
      <span className="font-medium">{props.result.displayName}</span>
      <span className="text-xs text-muted-foreground">
        {`${props.result.namespace}.${props.result.name}`}
      </span>
      <span className="text-xs text-muted-foreground">
        {`${DOWNLOAD_COUNT_FORMATTER.format(props.result.downloadCount)} downloads`}
      </span>
    </button>
  );
}

function ImportedThemeButton(props: {
  disabled: boolean;
  importedTheme: ImportedTheme;
  onPressStart: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      disabled={props.disabled}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          props.onPressStart();
        }
      }}
      onPointerDownCapture={props.onPressStart}
      onClick={props.onSelect}
    >
      <span className="font-medium">{props.importedTheme.label}</span>
      <span className="text-xs text-muted-foreground">Select</span>
    </button>
  );
}

function NewPresetDialog(props: {
  onAddPreset: (theme: ThemeValue) => void;
  onCreateBlankPreset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ThemeSearchResult[]>([]);
  const [importedThemes, setImportedThemes] = useState<ImportedTheme[]>([]);
  const [selectedResult, setSelectedResult] =
    useState<ThemeSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importingLabel, setImportingLabel] = useState<string | null>(null);
  const pendingDialogInteractionRef = useRef(false);

  const showImportedThemePicker =
    importedThemes.length > 1 && selectedResult !== null;

  function resetState() {
    setQuery('');
    setResults([]);
    setImportedThemes([]);
    setSelectedResult(null);
    setError(null);
    setHasSearched(false);
    setIsSearching(false);
    setIsImporting(false);
    setImportingLabel(null);
  }

  function closeDialog() {
    setOpen(false);
    resetState();
  }

  function armDialogInteractionGuard() {
    pendingDialogInteractionRef.current = true;
  }

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails?: DialogOpenChangeDetails,
  ) {
    if (nextOpen) {
      setOpen(true);
      return;
    }

    if (
      pendingDialogInteractionRef.current &&
      eventDetails !== undefined &&
      (eventDetails.reason === 'outside-press' ||
        eventDetails.reason === 'focus-out')
    ) {
      eventDetails.preventUnmountOnClose();
      return;
    }

    closeDialog();
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      setError('Enter a theme name to search.');
      return;
    }

    setError(null);
    setHasSearched(false);
    setResults([]);
    setImportedThemes([]);
    setSelectedResult(null);
    setIsSearching(true);
    armDialogInteractionGuard();

    try {
      const nextResults = await searchThemes(trimmedQuery);
      setResults(nextResults);
      setHasSearched(true);
    } catch (nextError) {
      setError(formatError(nextError));
    } finally {
      pendingDialogInteractionRef.current = false;
      setIsSearching(false);
    }
  }

  async function handleImportResult(result: ThemeSearchResult) {
    setError(null);
    setImportedThemes([]);
    setSelectedResult(null);
    setIsImporting(true);
    setImportingLabel(result.displayName);
    armDialogInteractionGuard();

    try {
      const nextThemes = await importTheme(result);

      if (nextThemes.length === 1) {
        const firstTheme = nextThemes[0];

        if (firstTheme === undefined) {
          throw new Error(
            'Imported extension did not include a readable theme.',
          );
        }

        handleImportedThemeSelect(firstTheme);
        return;
      }

      setImportedThemes(nextThemes);
      setSelectedResult(result);
    } catch (nextError) {
      setError(formatError(nextError));
    } finally {
      pendingDialogInteractionRef.current = false;
      setIsImporting(false);
      setImportingLabel(null);
    }
  }

  function handleImportedThemeSelect(importedTheme: ImportedTheme) {
    setError(null);
    armDialogInteractionGuard();

    try {
      const mappedTheme = mapVscodeTheme(
        importedTheme.vscodeTheme,
        importedTheme.label,
      );

      props.onAddPreset(mappedTheme);
      closeDialog();
    } catch (nextError) {
      setError(formatError(nextError));
    } finally {
      pendingDialogInteractionRef.current = false;
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => handleOpenChange(true)}
      >
        <Plus className="size-3.5" />
        New
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Preset</DialogTitle>
            <DialogDescription>
              Add a blank preset or import a VSCode theme from Open VSX.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-medium">Blank</h2>
                <p className="text-sm text-muted-foreground">
                  Start from the built-in palette and edit it directly.
                </p>
              </div>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  props.onCreateBlankPreset();
                  handleOpenChange(false);
                }}
              >
                <Plus className="size-4" />
                Blank preset
              </Button>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-medium">Import from VSCode</h2>
                <p className="text-sm text-muted-foreground">
                  Search Open VSX, download the extension, and map its theme
                  into the playground palette.
                </p>
              </div>

              <form className="flex gap-2" onSubmit={handleSearch}>
                <Input
                  value={query}
                  placeholder="Search Open VSX themes"
                  disabled={isSearching || isImporting}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSearching || isImporting}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      armDialogInteractionGuard();
                    }
                  }}
                  onPointerDownCapture={armDialogInteractionGuard}
                >
                  {isSearching ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </form>

              {isImporting ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  <span>{`Importing ${importingLabel ?? 'theme'}...`}</span>
                </div>
              ) : null}

              {error !== null && !showImportedThemePicker ? (
                <ImportErrorNotice message={error} />
              ) : null}

              {results.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Search Results
                  </p>
                  <ScrollArea className="h-60 rounded-md border">
                    <div className="flex flex-col py-1">
                      {results.map((result) => (
                        <SearchResultButton
                          key={`${result.namespace}.${result.name}`}
                          disabled={isSearching || isImporting}
                          onPressStart={armDialogInteractionGuard}
                          result={result}
                          onSelect={() => handleImportResult(result)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : hasSearched && !isSearching ? (
                <p className="text-sm text-muted-foreground">
                  No themes found.
                </p>
              ) : null}

              {showImportedThemePicker ? (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Included Themes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedResult.displayName}
                      </p>
                    </div>
                    {error !== null ? (
                      <ImportErrorNotice message={error} />
                    ) : null}
                    <ScrollArea className="h-48 rounded-md border">
                      <div className="flex flex-col py-1">
                        {importedThemes.map((importedTheme) => (
                          <ImportedThemeButton
                            key={`${selectedResult.namespace}.${selectedResult.name}.${importedTheme.label}`}
                            disabled={isSearching || isImporting}
                            importedTheme={importedTheme}
                            onPressStart={armDialogInteractionGuard}
                            onSelect={() =>
                              handleImportedThemeSelect(importedTheme)
                            }
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        <PopoverTrigger
          aria-label={`Pick color for ${props.label}`}
          render={
            <button
              type="button"
              className="size-6 shrink-0 rounded-sm border border-input shadow-sm"
              style={{ background: props.value }}
            />
          }
        />
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
  const { resolvedTheme } = useTheme();
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

  const editorTheme = resolvedTheme === 'light' ? 'light' : 'vs-dark';

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
            theme={editorTheme}
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
  const builtInPresets = props.presets.filter((preset) => preset.builtIn);
  const addedPresets = props.presets.filter(
    (preset) => preset.builtIn === false,
  );

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
          <ToolbarGroup className="w-full max-w-[30rem]">
            <ToolbarLabel>Preset</ToolbarLabel>
            <div className="flex items-center gap-2">
              <Select
                value={props.activePreset}
                onValueChange={(value) => {
                  if (value !== null) {
                    props.onSelectPreset(value);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectGroupLabel>Built-in</SelectGroupLabel>
                    {builtInPresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {presetLabel(preset)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  {addedPresets.length > 0 ? (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectGroupLabel>Added</SelectGroupLabel>
                        {addedPresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {presetLabel(preset)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  ) : null}
                </SelectContent>
              </Select>

              <NewPresetDialog
                onAddPreset={props.onAddPreset}
                onCreateBlankPreset={props.onCreateBlankPreset}
              />

              {props.canRemovePreset ? (
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                      />
                    }
                  >
                    <Ellipsis className="size-4" />
                    <span className="sr-only">Preset actions</span>
                  </MenuTrigger>
                  <MenuPopup align="end">
                    <MenuItem
                      variant="destructive"
                      onClick={props.onRemovePreset}
                    >
                      <Trash2 className="size-4" />
                      Remove preset
                    </MenuItem>
                  </MenuPopup>
                </Menu>
              ) : null}
            </div>
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
