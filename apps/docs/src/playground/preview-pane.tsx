'use client';

import type { Theme } from '@otheme/core/schema';
import { useState } from 'react';
import type {
  DiffLine,
  DiffSpan,
  LogLine,
  LogUiKey,
  PromptLine,
  SampleLine,
  Span,
  TokenKind,
} from './preview-sample';
import {
  APPLY_SUCCESS,
  CODE_SAMPLE,
  DIFF_SAMPLE,
  LOG_SAMPLE,
  MARKDOWN_SAMPLE,
  PROMPT_APPLY,
  PROMPT_DIFF,
  PROMPT_TRAIL,
} from './preview-sample';
import type { PaletteField, PreviewPaneProps } from './types';

const MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Resolve a token name to its color from the theme. */
function tokenColor(theme: Theme, token: TokenKind) {
  if (token === 'plain') return theme.ui.fg;
  if (token === 'comment') return theme.ui.comment;
  return theme.syntax[token];
}

/** Map a TokenKind to the PaletteField it draws from. */
function tokenField(token: TokenKind): PaletteField {
  if (token === 'plain') return { group: 'ui', key: 'fg' };
  if (token === 'comment') return { group: 'ui', key: 'comment' };
  return { group: 'syntax', key: token };
}

/** A token the user is hovering: which field it maps to, its hex, and its on-screen rect. */
type HoverTarget = { field: PaletteField; hex: string; rect: DOMRect };

/**
 * Shared inspect context threaded to every span. When `active` is false the
 * spans render as plain text — no pointer, no hover fill, no tooltip, no click.
 */
type InspectContext = {
  active: boolean;
  onInspect: (field: PaletteField) => void;
  onHover: (target: HoverTarget | null) => void;
};

const INSPECTABLE_CLASS = 'otheme-inspectable';

/**
 * Class-based hover fill so the whole token region lights up like a
 * Chrome devtools highlight box; the neutral overlay reads on both
 * light and dark canvases.
 */
const INSPECTABLE_STYLE = `
.${INSPECTABLE_CLASS} {
  cursor: pointer;
  border-radius: 0.2rem;
  transition: background 0.08s ease;
}
.${INSPECTABLE_CLASS}:hover {
  background: rgba(128, 128, 128, 0.22);
}
`;

const TOGGLE_CLASS = 'otheme-toggle';

/**
 * Suppress the browser's default (often white) focus ring on the toggles in
 * favor of the same subtle surface + muted-border treatment as the active
 * state, so nothing reads as a harsh accent ring in the dark docs theme.
 */
const TOGGLE_STYLE = `
.${TOGGLE_CLASS}:focus-visible {
  outline: none;
  background: var(--vocs-background-color-surface);
  box-shadow: inset 0 0 0 1px var(--vocs-border-color-primary);
}
`;

/**
 * A colored token. Always renders the SAME inline <span> with identical box
 * metrics so toggling inspect mode never reflows the monospace text — when
 * active it only layers on non-flow-affecting interactivity (cursor, hover
 * background, outline) plus button semantics.
 */
function InspectableSpan(props: {
  color: string;
  field: PaletteField;
  inspect: InspectContext;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const baseStyle: React.CSSProperties = { color: props.color, ...props.style };

  if (!props.inspect.active) {
    return <span style={baseStyle}>{props.children}</span>;
  }

  function reportHover(e: React.MouseEvent<HTMLSpanElement>) {
    props.inspect.onHover({
      field: props.field,
      hex: props.color,
      rect: e.currentTarget.getBoundingClientRect(),
    });
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a real <button> changes the inline box metrics and reflows the monospace text on toggle; the span keeps layout identical between modes
    <span
      className={INSPECTABLE_CLASS}
      role="button"
      tabIndex={0}
      onClick={() => props.inspect.onInspect(props.field)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.inspect.onInspect(props.field);
        }
      }}
      onMouseEnter={reportHover}
      onMouseMove={reportHover}
      onMouseLeave={() => props.inspect.onHover(null)}
      onFocus={(e) =>
        props.inspect.onHover({
          field: props.field,
          hex: props.color,
          rect: e.currentTarget.getBoundingClientRect(),
        })
      }
      onBlur={() => props.inspect.onHover(null)}
      style={baseStyle}
    >
      {props.children}
    </span>
  );
}

/** The single floating tooltip; rendered once per pane, driven by hover state. */
function InspectTooltip(props: { target: HoverTarget }) {
  const label = `${props.target.field.group}.${props.target.field.key}`;
  const top = props.target.rect.bottom + 6;
  const left = props.target.rect.left;
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.2rem 0.45rem',
        background: 'var(--vocs-background-color-surface)',
        border: '1px solid var(--vocs-border-color-primary)',
        borderRadius: 'var(--vocs-radius-sm)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
        fontFamily: 'var(--vocs-font-mono)',
        fontSize: '0.7rem',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--vocs-text-color-primary)' }}>{label}</span>
      <span
        style={{
          width: '0.7rem',
          height: '0.7rem',
          borderRadius: '0.15rem',
          background: props.target.hex,
          border: '1px solid var(--vocs-border-color-primary)',
        }}
      />
      <span style={{ color: 'var(--vocs-text-color-secondary)' }}>
        {props.target.hex}
      </span>
    </div>
  );
}

function CodeLines(props: {
  theme: Theme;
  lines: SampleLine[];
  startLine: number;
  inspect: InspectContext;
}) {
  return (
    <>
      {props.lines.map((line, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          key={index}
          style={{ display: 'flex', whiteSpace: 'pre' }}
        >
          <InspectableSpan
            color={props.theme.ui.lineNr}
            field={{ group: 'ui', key: 'lineNr' }}
            inspect={props.inspect}
            style={{
              minWidth: '2.5rem',
              textAlign: 'right',
              paddingRight: '1rem',
              userSelect: 'none',
            }}
          >
            {props.startLine + index}
          </InspectableSpan>
          <span>
            {line.map((span: Span, spanIndex) => (
              <InspectableSpan
                // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
                key={spanIndex}
                color={tokenColor(props.theme, span.token)}
                field={tokenField(span.token)}
                inspect={props.inspect}
              >
                {span.text}
              </InspectableSpan>
            ))}
          </span>
        </div>
      ))}
    </>
  );
}

/** A zsh-style prompt line followed by the typed command. */
function Prompt(props: {
  theme: Theme;
  prompt: PromptLine;
  inspect: InspectContext;
  cursor?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', whiteSpace: 'pre' }}>
      <InspectableSpan
        color={props.theme.ui.accent}
        field={{ group: 'ui', key: 'accent' }}
        inspect={props.inspect}
      >
        {props.prompt.dir}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.fgMuted}
        field={{ group: 'ui', key: 'fgMuted' }}
        inspect={props.inspect}
      >
        {props.prompt.branch}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.success}
        field={{ group: 'ui', key: 'success' }}
        inspect={props.inspect}
      >
        ❯
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.fg}
        field={{ group: 'ui', key: 'fg' }}
        inspect={props.inspect}
      >
        {props.prompt.command}
      </InspectableSpan>
      {props.cursor === true && (
        <InspectableSpan
          color={props.theme.ui.accent}
          field={{ group: 'ui', key: 'accent' }}
          inspect={props.inspect}
          style={{
            display: 'inline-block',
            width: '0.55rem',
            height: '1.05rem',
            background: props.theme.ui.accent,
          }}
        >
          {' '}
        </InspectableSpan>
      )}
    </div>
  );
}

/** Resolve a log segment's semantic ui field to a color. */
function logColor(theme: Theme, ui: LogUiKey) {
  return theme.ui[ui];
}

/** The build/server log stream (window 2), exercising the semantic ui palette. */
function LogLines(props: {
  theme: Theme;
  lines: LogLine[];
  inspect: InspectContext;
}) {
  return (
    <div>
      {props.lines.map((line, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          key={index}
          style={{ whiteSpace: 'pre' }}
        >
          {line.map((seg, segIndex) => (
            <InspectableSpan
              // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
              key={segIndex}
              color={logColor(props.theme, seg.ui)}
              field={{ group: 'ui', key: seg.ui }}
              inspect={props.inspect}
            >
              {seg.text}
            </InspectableSpan>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Background for a diff row based on its type. */
function diffRowBackground(theme: Theme, type: DiffLine['type']) {
  if (type === 'removed') return theme.ui.diffDel;
  if (type === 'added') return theme.ui.diffAdd;
  return theme.ui.bg;
}

/** Background for an emphasized word based on the diff row type. */
function emphasisBackground(theme: Theme, type: DiffLine['type']) {
  if (type === 'removed') return theme.ui.error;
  if (type === 'added') return theme.ui.success;
  return 'transparent';
}

/** Gutter line-number color based on the diff row type. */
function gutterColor(theme: Theme, type: DiffLine['type']) {
  if (type === 'removed') return theme.ui.error;
  if (type === 'added') return theme.ui.success;
  return theme.ui.lineNr;
}

/** PaletteField for the diff row background. */
function diffRowBackgroundField(type: DiffLine['type']): PaletteField {
  if (type === 'removed') return { group: 'ui', key: 'diffDel' };
  if (type === 'added') return { group: 'ui', key: 'diffAdd' };
  return { group: 'ui', key: 'bg' };
}

/** PaletteField for the gutter color. */
function gutterColorField(type: DiffLine['type']): PaletteField {
  if (type === 'removed') return { group: 'ui', key: 'error' };
  if (type === 'added') return { group: 'ui', key: 'success' };
  return { group: 'ui', key: 'lineNr' };
}

/** PaletteField for an emphasized diff word. */
function emphasisField(type: DiffLine['type']): PaletteField {
  if (type === 'removed') return { group: 'ui', key: 'error' };
  if (type === 'added') return { group: 'ui', key: 'success' };
  return { group: 'ui', key: 'fg' };
}

function DiffSpanText(props: {
  theme: Theme;
  span: DiffSpan;
  type: DiffLine['type'];
  inspect: InspectContext;
}) {
  if (props.span.kind === 'emphasis') {
    return (
      <InspectableSpan
        color={props.theme.ui.bg}
        field={emphasisField(props.type)}
        inspect={props.inspect}
        style={{
          background: emphasisBackground(props.theme, props.type),
          borderRadius: '0.15rem',
        }}
      >
        {props.span.text}
      </InspectableSpan>
    );
  }
  return <span>{props.span.text}</span>;
}

function DiffRow(props: {
  theme: Theme;
  line: DiffLine;
  inspect: InspectContext;
}) {
  if (props.line.type === 'hunk') {
    return (
      <div
        style={{
          color: props.theme.ui.fgMuted,
          background: props.theme.ui.bg,
          whiteSpace: 'pre',
          padding: '0.05rem 0',
        }}
      >
        {props.line.spans.map((span, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          <span key={index}>{span.text}</span>
        ))}
      </div>
    );
  }

  const bgField = diffRowBackgroundField(props.line.type);
  const gutterField = gutterColorField(props.line.type);

  return (
    <div
      style={{
        display: 'flex',
        background: diffRowBackground(props.theme, props.line.type),
        whiteSpace: 'pre',
        padding: '0.05rem 0',
      }}
    >
      <InspectableSpan
        color={gutterColor(props.theme, props.line.type)}
        field={gutterField}
        inspect={props.inspect}
        style={{
          minWidth: '2.25rem',
          textAlign: 'right',
          paddingRight: '0.5rem',
          userSelect: 'none',
        }}
      >
        {props.line.lineNrOld}
      </InspectableSpan>
      <InspectableSpan
        color={gutterColor(props.theme, props.line.type)}
        field={gutterField}
        inspect={props.inspect}
        style={{
          minWidth: '2.25rem',
          textAlign: 'right',
          paddingRight: '1rem',
          userSelect: 'none',
        }}
      >
        {props.line.lineNrNew}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.fg}
        field={bgField}
        inspect={props.inspect}
      >
        {props.line.spans.map((span, index) => (
          <DiffSpanText
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
            key={index}
            theme={props.theme}
            span={span}
            type={props.line.type}
            inspect={props.inspect}
          />
        ))}
      </InspectableSpan>
    </div>
  );
}

function DiffRegion(props: { theme: Theme; inspect: InspectContext }) {
  return (
    <div>
      {DIFF_SAMPLE.map((line, index) => (
        <DiffRow
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          key={index}
          theme={props.theme}
          line={line}
          inspect={props.inspect}
        />
      ))}
    </div>
  );
}

/** Multi-line plain output (e.g. the markdown rendered by `cat`). */
function OutputLines(props: {
  theme: Theme;
  lines: SampleLine[];
  inspect: InspectContext;
}) {
  return (
    <div>
      {props.lines.map((line, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          key={index}
          style={{ whiteSpace: 'pre' }}
        >
          {line.map((span: Span, spanIndex) => (
            <InspectableSpan
              // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
              key={spanIndex}
              color={tokenColor(props.theme, span.token)}
              field={tokenField(span.token)}
              inspect={props.inspect}
            >
              {span.text}
            </InspectableSpan>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The success line printed by `otheme set`, colored with ui.success. */
function SuccessLine(props: { theme: Theme; inspect: InspectContext }) {
  return (
    <InspectableSpan
      color={props.theme.ui.success}
      field={{ group: 'ui', key: 'success' }}
      inspect={props.inspect}
      style={{
        display: 'block',
        whiteSpace: 'pre',
      }}
    >
      ✓ {APPLY_SUCCESS}
    </InspectableSpan>
  );
}

/** The id of each tmux window the user can switch between. */
type WindowId = 'zsh' | 'logs' | 'editor' | 'docs';

const WINDOW_TABS: { id: WindowId; label: string }[] = [
  { id: 'zsh', label: '1:zsh' },
  { id: 'logs', label: '2:logs' },
  { id: 'editor', label: '3:editor' },
  { id: 'docs', label: '4:docs' },
];

/** Fills the canvas body, scrolling on its own when the window overflows. */
function WindowBody(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: '0.85rem',
        fontSize: '0.8rem',
        lineHeight: 1.6,
      }}
    >
      {props.children}
    </div>
  );
}

/** Window 1: a short shell session — git-delta diff then `otheme set`. */
function ShellWindow(props: { theme: Theme; inspect: InspectContext }) {
  return (
    <WindowBody>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div>
          <Prompt
            theme={props.theme}
            prompt={PROMPT_DIFF}
            inspect={props.inspect}
          />
          <DiffRegion theme={props.theme} inspect={props.inspect} />
        </div>
        <div>
          <Prompt
            theme={props.theme}
            prompt={PROMPT_APPLY}
            inspect={props.inspect}
          />
          <SuccessLine theme={props.theme} inspect={props.inspect} />
        </div>
        <Prompt
          theme={props.theme}
          prompt={PROMPT_TRAIL}
          inspect={props.inspect}
          cursor
        />
      </div>
    </WindowBody>
  );
}

/** Window 2: the log stream. */
function LogsWindow(props: { theme: Theme; inspect: InspectContext }) {
  return (
    <WindowBody>
      <LogLines
        theme={props.theme}
        lines={LOG_SAMPLE}
        inspect={props.inspect}
      />
    </WindowBody>
  );
}

/** Window 3: nvim editing card.tsx. */
function EditorWindow(props: { theme: Theme; inspect: InspectContext }) {
  return (
    <WindowBody>
      <CodeLines
        theme={props.theme}
        lines={CODE_SAMPLE}
        startLine={1}
        inspect={props.inspect}
      />
    </WindowBody>
  );
}

/** Window 4: the rendered markdown doc. */
function DocsWindow(props: { theme: Theme; inspect: InspectContext }) {
  return (
    <WindowBody>
      <OutputLines
        theme={props.theme}
        lines={MARKDOWN_SAMPLE}
        inspect={props.inspect}
      />
    </WindowBody>
  );
}

function ActiveWindow(props: {
  window: WindowId;
  theme: Theme;
  inspect: InspectContext;
}) {
  if (props.window === 'zsh')
    return <ShellWindow theme={props.theme} inspect={props.inspect} />;
  if (props.window === 'logs')
    return <LogsWindow theme={props.theme} inspect={props.inspect} />;
  if (props.window === 'editor')
    return <EditorWindow theme={props.theme} inspect={props.inspect} />;
  return <DocsWindow theme={props.theme} inspect={props.inspect} />;
}

/** Prefer the tmux target's muted color, fall back to the ui muted foreground. */
function tmuxMuted(theme: Theme) {
  const tmux = theme.targets.tmux;
  if (tmux !== undefined) return tmux.muted;
  return theme.ui.fgMuted;
}

/**
 * A clickable tmux window tab. This is a real control, not an inspect target —
 * clicking always switches the window, even while inspect mode is on, so the
 * tab takes precedence over color inspection.
 */
function WindowTab(props: {
  theme: Theme;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={TOGGLE_CLASS}
      onClick={props.onSelect}
      aria-pressed={props.active}
      style={{
        all: 'unset',
        cursor: 'pointer',
        padding: '0 0.1rem',
        borderRadius: '0.15rem',
        color: props.active ? props.theme.ui.accent : tmuxMuted(props.theme),
        fontWeight: props.active ? 700 : 400,
      }}
    >
      {props.label}
    </button>
  );
}

function TmuxBar(props: {
  theme: Theme;
  prefixActive: boolean;
  activeWindow: WindowId;
  onSelectWindow: (window: WindowId) => void;
  inspect: InspectContext;
}) {
  const muted = tmuxMuted(props.theme);
  const mutedField: PaletteField = { group: 'ui', key: 'fgMuted' };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.8rem',
        background: props.theme.ui.bg,
        padding: '0.4rem 0.85rem',
        borderBottom: `1px solid ${props.theme.ui.border}`,
      }}
    >
      {WINDOW_TABS.map((tab) => (
        <WindowTab
          key={tab.id}
          theme={props.theme}
          label={tab.label}
          active={props.activeWindow === tab.id}
          onSelect={() => props.onSelectWindow(tab.id)}
        />
      ))}
      <InspectableSpan
        color={props.prefixActive ? props.theme.ui.accentFg : muted}
        field={
          props.prefixActive ? { group: 'ui', key: 'accentFg' } : mutedField
        }
        inspect={props.inspect}
        style={{
          marginLeft: 'auto',
          padding: '0.1rem 0.6rem',
          borderRadius: '0.2rem',
          fontWeight: props.prefixActive ? 700 : 400,
          background: props.prefixActive
            ? props.theme.ui.accent
            : 'transparent',
        }}
      >
        otheme
      </InspectableSpan>
    </div>
  );
}

function ToggleButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={TOGGLE_CLASS}
      onClick={props.onClick}
      aria-pressed={props.active}
      style={{
        padding: '0.2rem 0.7rem',
        borderRadius: 'var(--vocs-radius-sm)',
        border: '1px solid var(--vocs-border-color-primary)',
        background: props.active
          ? 'var(--vocs-background-color-surface)'
          : 'var(--vocs-background-color-primary)',
        color: props.active
          ? 'var(--vocs-text-color-primary)'
          : 'var(--vocs-text-color-secondary)',
        boxShadow: props.active
          ? 'inset 0 0 0 1px var(--vocs-border-color-primary)'
          : 'none',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: props.active ? 600 : 500,
        fontFamily: 'var(--vocs-font-sans)',
      }}
    >
      {props.children}
    </button>
  );
}

export function PreviewPane(props: PreviewPaneProps) {
  const [prefixActive, setPrefixActive] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowId>('zsh');
  const [hovered, setHovered] = useState<HoverTarget | null>(null);

  const inspect: InspectContext = {
    active: props.inspectMode,
    onInspect: props.onInspect,
    onHover: setHovered,
  };

  return (
    <div
      style={{
        padding: '1rem',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`${INSPECTABLE_STYLE}${TOGGLE_STYLE}`}</style>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <ToggleButton
          active={prefixActive}
          onClick={() => setPrefixActive((prev) => !prev)}
        >
          prefix active
        </ToggleButton>
        <ToggleButton
          active={props.inspectMode}
          onClick={props.onToggleInspect}
        >
          Inspect
        </ToggleButton>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: props.theme.ui.bg,
          color: props.theme.ui.fg,
          fontFamily: MONO_FONT,
          borderRadius: '0.6rem',
          border: `1px solid ${props.theme.ui.border}`,
          overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
          cursor: props.inspectMode ? 'cell' : 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 0.85rem',
            borderBottom: `1px solid ${props.theme.ui.border}`,
            background: props.theme.ui.bgFloat,
          }}
        >
          <InspectableSpan
            color={props.theme.ui.error}
            field={{ group: 'ui', key: 'error' }}
            inspect={inspect}
            style={{
              display: 'inline-block',
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              background: props.theme.ui.error,
            }}
          >
            {''}
          </InspectableSpan>
          <InspectableSpan
            color={props.theme.ui.warning}
            field={{ group: 'ui', key: 'warning' }}
            inspect={inspect}
            style={{
              display: 'inline-block',
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              background: props.theme.ui.warning,
            }}
          >
            {''}
          </InspectableSpan>
          <InspectableSpan
            color={props.theme.ui.success}
            field={{ group: 'ui', key: 'success' }}
            inspect={inspect}
            style={{
              display: 'inline-block',
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              background: props.theme.ui.success,
            }}
          >
            {''}
          </InspectableSpan>
          <InspectableSpan
            color={props.theme.ui.fgMuted}
            field={{ group: 'ui', key: 'fgMuted' }}
            inspect={inspect}
            style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}
          >
            {props.theme.name}
          </InspectableSpan>
        </div>
        <TmuxBar
          theme={props.theme}
          prefixActive={prefixActive}
          activeWindow={activeWindow}
          onSelectWindow={setActiveWindow}
          inspect={inspect}
        />
        <ActiveWindow
          window={activeWindow}
          theme={props.theme}
          inspect={inspect}
        />
      </div>
      {props.inspectMode && hovered !== null && (
        <InspectTooltip target={hovered} />
      )}
    </div>
  );
}
