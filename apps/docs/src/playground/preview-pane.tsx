'use client';

import type { Theme } from '@otheme/core/schema';
import { useState } from 'react';
import type {
  DiffLine,
  DiffSpan,
  PromptLine,
  SampleLine,
  Span,
  TokenKind,
} from './preview-sample';
import {
  APPLY_SUCCESS,
  CODE_SAMPLE,
  DIFF_SAMPLE,
  MARKDOWN_SAMPLE,
  PROMPT_APPLY,
  PROMPT_CODE,
  PROMPT_DIFF,
  PROMPT_README,
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

const INSPECTABLE_SPAN_STYLE: React.CSSProperties = {
  cursor: 'pointer',
  borderRadius: '0.1rem',
};

function InspectableSpan(props: {
  color: string;
  field: PaletteField;
  onInspect: (field: PaletteField) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const label = `${props.field.group}.${props.field.key}`;
  return (
    <button
      type="button"
      title={label}
      onClick={() => props.onInspect(props.field)}
      style={{
        all: 'unset',
        ...INSPECTABLE_SPAN_STYLE,
        color: props.color,
        ...props.style,
      }}
    >
      {props.children}
    </button>
  );
}

function CodeLines(props: {
  theme: Theme;
  lines: SampleLine[];
  startLine: number;
  onInspect: (field: PaletteField) => void;
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
            onInspect={props.onInspect}
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
                onInspect={props.onInspect}
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
  onInspect: (field: PaletteField) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', whiteSpace: 'pre' }}>
      <InspectableSpan
        color={props.theme.ui.accent}
        field={{ group: 'ui', key: 'accent' }}
        onInspect={props.onInspect}
      >
        {props.prompt.dir}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.fgMuted}
        field={{ group: 'ui', key: 'fgMuted' }}
        onInspect={props.onInspect}
      >
        {props.prompt.branch}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.success}
        field={{ group: 'ui', key: 'success' }}
        onInspect={props.onInspect}
      >
        ❯
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.fg}
        field={{ group: 'ui', key: 'fg' }}
        onInspect={props.onInspect}
      >
        {props.prompt.command}
      </InspectableSpan>
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

function DiffSpanText(props: {
  theme: Theme;
  span: DiffSpan;
  type: DiffLine['type'];
  onInspect: (field: PaletteField) => void;
}) {
  if (props.span.kind === 'emphasis') {
    const field: PaletteField =
      props.type === 'removed'
        ? { group: 'ui', key: 'error' }
        : props.type === 'added'
          ? { group: 'ui', key: 'success' }
          : { group: 'ui', key: 'fg' };
    return (
      <InspectableSpan
        color={props.theme.ui.bg}
        field={field}
        onInspect={props.onInspect}
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
  onInspect: (field: PaletteField) => void;
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
        onInspect={props.onInspect}
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
        onInspect={props.onInspect}
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
        onInspect={props.onInspect}
      >
        {props.line.spans.map((span, index) => (
          <DiffSpanText
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
            key={index}
            theme={props.theme}
            span={span}
            type={props.line.type}
            onInspect={props.onInspect}
          />
        ))}
      </InspectableSpan>
    </div>
  );
}

function DiffRegion(props: {
  theme: Theme;
  onInspect: (field: PaletteField) => void;
}) {
  return (
    <div>
      {DIFF_SAMPLE.map((line, index) => (
        <DiffRow
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          key={index}
          theme={props.theme}
          line={line}
          onInspect={props.onInspect}
        />
      ))}
    </div>
  );
}

/** Multi-line plain output (e.g. the markdown rendered by `cat`). */
function OutputLines(props: {
  theme: Theme;
  lines: SampleLine[];
  onInspect: (field: PaletteField) => void;
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
              onInspect={props.onInspect}
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
function SuccessLine(props: {
  theme: Theme;
  onInspect: (field: PaletteField) => void;
}) {
  return (
    <InspectableSpan
      color={props.theme.ui.success}
      field={{ group: 'ui', key: 'success' }}
      onInspect={props.onInspect}
      style={{
        display: 'block',
        whiteSpace: 'pre',
      }}
    >
      ✓ {APPLY_SUCCESS}
    </InspectableSpan>
  );
}

/** A blinking-style block cursor after the final prompt. */
function PromptCursor(props: {
  theme: Theme;
  onInspect: (field: PaletteField) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', whiteSpace: 'pre' }}>
      <InspectableSpan
        color={props.theme.ui.accent}
        field={{ group: 'ui', key: 'accent' }}
        onInspect={props.onInspect}
      >
        {PROMPT_README.dir}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.fgMuted}
        field={{ group: 'ui', key: 'fgMuted' }}
        onInspect={props.onInspect}
      >
        {PROMPT_README.branch}
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.success}
        field={{ group: 'ui', key: 'success' }}
        onInspect={props.onInspect}
      >
        ❯
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.accent}
        field={{ group: 'ui', key: 'accent' }}
        onInspect={props.onInspect}
        style={{
          display: 'inline-block',
          width: '0.55rem',
          height: '1.05rem',
          background: props.theme.ui.accent,
        }}
      >
        {' '}
      </InspectableSpan>
    </div>
  );
}

/** The scrollback: prompts whose output is the existing sample data. */
function Session(props: {
  theme: Theme;
  onInspect: (field: PaletteField) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        fontSize: '0.8rem',
        lineHeight: 1.6,
      }}
    >
      <div>
        <Prompt
          theme={props.theme}
          prompt={PROMPT_README}
          onInspect={props.onInspect}
        />
        <OutputLines
          theme={props.theme}
          lines={MARKDOWN_SAMPLE}
          onInspect={props.onInspect}
        />
      </div>
      <div>
        <Prompt
          theme={props.theme}
          prompt={PROMPT_CODE}
          onInspect={props.onInspect}
        />
        <CodeLines
          theme={props.theme}
          lines={CODE_SAMPLE}
          startLine={1}
          onInspect={props.onInspect}
        />
      </div>
      <div>
        <Prompt
          theme={props.theme}
          prompt={PROMPT_DIFF}
          onInspect={props.onInspect}
        />
        <DiffRegion theme={props.theme} onInspect={props.onInspect} />
      </div>
      <div>
        <Prompt
          theme={props.theme}
          prompt={PROMPT_APPLY}
          onInspect={props.onInspect}
        />
        <SuccessLine theme={props.theme} onInspect={props.onInspect} />
      </div>
      <PromptCursor theme={props.theme} onInspect={props.onInspect} />
    </div>
  );
}

/** Prefer the tmux target's muted color, fall back to the ui muted foreground. */
function tmuxMuted(theme: Theme) {
  const tmux = theme.targets.tmux;
  if (tmux !== undefined) return tmux.muted;
  return theme.ui.fgMuted;
}

function TmuxBar(props: {
  theme: Theme;
  prefixActive: boolean;
  onInspect: (field: PaletteField) => void;
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
      <InspectableSpan
        color={muted}
        field={mutedField}
        onInspect={props.onInspect}
      >
        1:zsh
      </InspectableSpan>
      <InspectableSpan
        color={muted}
        field={mutedField}
        onInspect={props.onInspect}
      >
        2:logs
      </InspectableSpan>
      <InspectableSpan
        color={props.theme.ui.accent}
        field={{ group: 'ui', key: 'accent' }}
        onInspect={props.onInspect}
        style={{ fontWeight: 700 }}
      >
        3:editor
      </InspectableSpan>
      <InspectableSpan
        color={props.prefixActive ? props.theme.ui.accentFg : muted}
        field={
          props.prefixActive ? { group: 'ui', key: 'accentFg' } : mutedField
        }
        onInspect={props.onInspect}
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

export function PreviewPane(props: PreviewPaneProps) {
  const [prefixActive, setPrefixActive] = useState(false);

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
      <div style={{ marginBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setPrefixActive((prev) => !prev)}
          style={{
            padding: '0.2rem 0.7rem',
            borderRadius: 'var(--vocs-radius-sm)',
            border: '1px solid var(--vocs-border-color-primary)',
            background: prefixActive
              ? 'var(--vocs-color-accent)'
              : 'var(--vocs-background-color-primary)',
            color: prefixActive
              ? 'var(--vocs-color-accentInvert)'
              : 'var(--vocs-text-color-primary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontFamily: 'var(--vocs-font-sans)',
          }}
        >
          prefix active
        </button>
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
            onInspect={props.onInspect}
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
            onInspect={props.onInspect}
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
            onInspect={props.onInspect}
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
            onInspect={props.onInspect}
            style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}
          >
            {props.theme.name}
          </InspectableSpan>
        </div>
        <TmuxBar
          theme={props.theme}
          prefixActive={prefixActive}
          onInspect={props.onInspect}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '0.85rem',
            overflow: 'auto',
          }}
        >
          <Session theme={props.theme} onInspect={props.onInspect} />
        </div>
      </div>
    </div>
  );
}
