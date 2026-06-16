'use client';

import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type { SyntaxColors, UiColors } from '@otheme/core/schema';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import targetsSchema from '../../../../packages/core/theme.schema.json';
import type { EditorPaneProps, ThemeValue } from './types';

function readDocsTheme(): 'vs-dark' | 'light' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.vocsTheme === 'dark'
    ? 'vs-dark'
    : 'light';
}

function useMonacoTheme(): 'vs-dark' | 'light' {
  const [monacoTheme, setMonacoTheme] = useState<'vs-dark' | 'light'>(
    readDocsTheme,
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMonacoTheme(readDocsTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-vocs-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return monacoTheme;
}

const TARGETS_SCHEMA_URI = 'otheme://theme/targets.json';

function ColorField(props: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleHexInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      props.onChange(val);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.4rem',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: 'var(--vocs-radius-sm)',
          border: '1px solid var(--vocs-border-color-primary)',
          background: props.value,
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
        }}
        aria-label={`Pick color for ${props.label}`}
      />
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--vocs-text-color-secondary)',
          minWidth: '9rem',
          fontFamily: 'var(--vocs-font-mono)',
        }}
      >
        {props.label}
      </span>
      <input
        type="text"
        defaultValue={props.value}
        key={props.value}
        onBlur={handleHexInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter')
            handleHexInput(e as unknown as React.ChangeEvent<HTMLInputElement>);
        }}
        maxLength={7}
        style={{
          width: '5.5rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--vocs-font-mono)',
          padding: '0.15rem 0.35rem',
          border: '1px solid var(--vocs-border-color-primary)',
          borderRadius: 'var(--vocs-radius-sm)',
          outline: 'none',
          background: 'var(--vocs-background-color-surface)',
          color: 'var(--vocs-text-color-primary)',
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            left: 0,
            zIndex: 100,
            background: 'var(--vocs-background-color-surface)',
            border: '1px solid var(--vocs-border-color-primary)',
            borderRadius: 'var(--vocs-radius-lg)',
            padding: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <HexColorPicker color={props.value} onChange={props.onChange} />
        </div>
      )}
    </div>
  );
}

function ColorGroup<T extends Record<string, string>>(props: {
  label: string;
  colors: T;
  onChange: (updated: T) => void;
}) {
  function handleFieldChange(field: string, hex: string) {
    props.onChange({ ...props.colors, [field]: hex } as T);
  }

  return (
    <section style={{ marginBottom: '1.25rem' }}>
      <h3
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--vocs-text-color-muted)',
          margin: '0 0 0.5rem',
          fontFamily: 'var(--vocs-font-sans)',
        }}
      >
        {props.label}
      </h3>
      <div>
        {Object.keys(props.colors).map((field) => (
          <ColorField
            key={field}
            label={field}
            value={props.colors[field] as string}
            onChange={(hex) => handleFieldChange(field, hex)}
          />
        ))}
      </div>
    </section>
  );
}

function TargetsEditor(props: {
  targets: ThemeValue['targets'];
  onChange: (updated: ThemeValue['targets']) => void;
}) {
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(props.targets, null, 2),
  );

  useEffect(() => {
    setJsonText(JSON.stringify(props.targets, null, 2));
  }, [props.targets]);

  const monacoTheme = useMonacoTheme();

  const handleMount: OnMount = useCallback((editor, monaco) => {
    const model = editor.getModel();
    if (model === null)
      throw new Error('Monaco editor model is null after mount');

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: TARGETS_SCHEMA_URI,
          fileMatch: [model.uri.toString()],
          schema: (targetsSchema as { properties: { targets: unknown } })
            .properties.targets,
        },
      ],
    });
  }, []);

  function handleChange(value: string | undefined) {
    if (value === undefined) return;
    setJsonText(value);
    try {
      const parsed = JSON.parse(value) as ThemeValue['targets'];
      props.onChange(parsed);
    } catch {
      // Invalid JSON — let Monaco surface the error, do not call onChange
    }
  }

  return (
    <section>
      <h3
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--vocs-text-color-muted)',
          margin: '0 0 0.5rem',
          fontFamily: 'var(--vocs-font-sans)',
        }}
      >
        Targets
      </h3>
      <div
        style={{
          border: '1px solid var(--vocs-border-color-primary)',
          borderRadius: 'var(--vocs-radius-md)',
          overflow: 'hidden',
        }}
      >
        <MonacoEditor
          height="320px"
          language="json"
          theme={monacoTheme}
          value={jsonText}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            tabSize: 2,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </section>
  );
}

export function EditorPane(props: EditorPaneProps) {
  function handleUiChange(updated: UiColors) {
    props.onChange({ ...props.theme, ui: updated });
  }

  function handleSyntaxChange(updated: SyntaxColors) {
    props.onChange({ ...props.theme, syntax: updated });
  }

  function handleTargetsChange(updated: ThemeValue['targets']) {
    props.onChange({ ...props.theme, targets: updated });
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    props.onChange({ ...props.theme, name: e.target.value });
  }

  function handleAppearanceToggle() {
    const next: ThemeValue['appearance'] =
      props.theme.appearance === 'dark' ? 'light' : 'dark';
    props.onChange({ ...props.theme, appearance: next });
  }

  return (
    <div
      style={{
        padding: '1rem',
        boxSizing: 'border-box',
        height: '100%',
        overflowY: 'auto',
        fontFamily: 'var(--vocs-font-sans)',
      }}
    >
      <section
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: 'var(--vocs-text-color-primary)',
            }}
          >
            Name
          </span>
          <input
            type="text"
            value={props.theme.name}
            onChange={handleNameChange}
            style={{
              fontSize: '0.85rem',
              fontFamily: 'var(--vocs-font-sans)',
              padding: '0.2rem 0.5rem',
              border: '1px solid var(--vocs-border-color-primary)',
              borderRadius: 'var(--vocs-radius-sm)',
              outline: 'none',
              background: 'var(--vocs-background-color-surface)',
              color: 'var(--vocs-text-color-primary)',
            }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: 'var(--vocs-text-color-primary)',
            }}
          >
            Appearance
          </span>
          <button
            type="button"
            onClick={handleAppearanceToggle}
            style={{
              padding: '0.2rem 0.75rem',
              borderRadius: 'var(--vocs-radius-sm)',
              border: '1px solid var(--vocs-border-color-primary)',
              background:
                props.theme.appearance === 'dark'
                  ? 'var(--vocs-color-accent)'
                  : 'var(--vocs-background-color-surface)',
              color:
                props.theme.appearance === 'dark'
                  ? 'var(--vocs-color-accentInvert)'
                  : 'var(--vocs-text-color-primary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              fontFamily: 'var(--vocs-font-sans)',
            }}
          >
            {props.theme.appearance}
          </button>
        </label>
      </section>

      <div
        style={{
          borderBottom: '1px solid var(--vocs-border-color-primary)',
          marginBottom: '1.25rem',
        }}
      />

      <ColorGroup<UiColors>
        label="UI"
        colors={props.theme.ui}
        onChange={handleUiChange}
      />

      <div
        style={{
          borderBottom: '1px solid var(--vocs-border-color-primary)',
          marginBottom: '1.25rem',
        }}
      />

      <ColorGroup<SyntaxColors>
        label="Syntax"
        colors={props.theme.syntax}
        onChange={handleSyntaxChange}
      />

      <div
        style={{
          borderBottom: '1px solid var(--vocs-border-color-primary)',
          marginBottom: '1.25rem',
        }}
      />

      <TargetsEditor
        targets={props.theme.targets}
        onChange={handleTargetsChange}
      />
    </div>
  );
}
