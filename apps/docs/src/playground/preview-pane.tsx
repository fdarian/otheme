'use client';

import type { Theme } from '@otheme/core/schema';
import { useState } from 'react';
import type {
  DiffLine,
  DiffSpan,
  SampleLine,
  Span,
  TokenKind,
} from './preview-sample';
import {
  CODE_SAMPLE,
  DIFF_SAMPLE,
  MARKDOWN_SAMPLE,
  MARKDOWN_TAB_GAP,
} from './preview-sample';
import type { PreviewPaneProps } from './types';

const MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Resolve a token name to its color from the theme. */
function tokenColor(theme: Theme, token: TokenKind) {
  if (token === 'plain') return theme.ui.fg;
  if (token === 'comment') return theme.ui.comment;
  return theme.syntax[token];
}

function CodeLines(props: {
  theme: Theme;
  lines: SampleLine[];
  startLine: number;
}) {
  return (
    <>
      {props.lines.map((line, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
          key={index}
          style={{ display: 'flex', whiteSpace: 'pre' }}
        >
          <span
            style={{
              color: props.theme.ui.lineNr,
              minWidth: '2.5rem',
              textAlign: 'right',
              paddingRight: '1rem',
              userSelect: 'none',
            }}
          >
            {props.startLine + index}
          </span>
          <span>
            {line.map((span: Span, spanIndex) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
                key={spanIndex}
                style={{ color: tokenColor(props.theme, span.token) }}
              >
                {span.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </>
  );
}

function CodeRegion(props: { theme: Theme }) {
  return (
    <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
      <CodeLines theme={props.theme} lines={CODE_SAMPLE} startLine={1} />
      <div style={{ height: MARKDOWN_TAB_GAP }} />
      <CodeLines theme={props.theme} lines={MARKDOWN_SAMPLE} startLine={1} />
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

function DiffSpanText(props: {
  theme: Theme;
  span: DiffSpan;
  type: DiffLine['type'];
}) {
  if (props.span.kind === 'emphasis') {
    return (
      <span
        style={{
          background: emphasisBackground(props.theme, props.type),
          color: props.theme.ui.bg,
          borderRadius: '0.15rem',
        }}
      >
        {props.span.text}
      </span>
    );
  }
  return <span>{props.span.text}</span>;
}

function DiffRow(props: { theme: Theme; line: DiffLine }) {
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

  return (
    <div
      style={{
        display: 'flex',
        background: diffRowBackground(props.theme, props.line.type),
        whiteSpace: 'pre',
        padding: '0.05rem 0',
      }}
    >
      <span
        style={{
          color: gutterColor(props.theme, props.line.type),
          minWidth: '2.25rem',
          textAlign: 'right',
          paddingRight: '0.5rem',
          userSelect: 'none',
        }}
      >
        {props.line.lineNrOld}
      </span>
      <span
        style={{
          color: gutterColor(props.theme, props.line.type),
          minWidth: '2.25rem',
          textAlign: 'right',
          paddingRight: '1rem',
          userSelect: 'none',
        }}
      >
        {props.line.lineNrNew}
      </span>
      <span style={{ color: props.theme.ui.fg }}>
        {props.line.spans.map((span, index) => (
          <DiffSpanText
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
            key={index}
            theme={props.theme}
            span={span}
            type={props.line.type}
          />
        ))}
      </span>
    </div>
  );
}

function DiffRegion(props: { theme: Theme }) {
  return (
    <div
      style={{
        fontSize: '0.8rem',
        lineHeight: 1.6,
        borderTop: `1px solid ${props.theme.ui.border}`,
        borderBottom: `1px solid ${props.theme.ui.border}`,
        margin: '1rem 0',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
      }}
    >
      {DIFF_SAMPLE.map((line, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static sample, index is stable
        <DiffRow key={index} theme={props.theme} line={line} />
      ))}
    </div>
  );
}

/** Prefer the tmux target's muted color, fall back to the ui muted foreground. */
function tmuxMuted(theme: Theme) {
  const tmux = theme.targets.tmux;
  if (tmux !== undefined) return tmux.muted;
  return theme.ui.fgMuted;
}

function TmuxBar(props: { theme: Theme; prefixActive: boolean }) {
  const muted = tmuxMuted(props.theme);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.8rem',
        background: props.theme.ui.bg,
        paddingTop: '0.5rem',
      }}
    >
      <span style={{ color: muted }}>1:zsh</span>
      <span style={{ color: muted }}>2:logs</span>
      <span style={{ color: props.theme.ui.accent, fontWeight: 700 }}>
        3:editor
      </span>
      <span
        style={{
          marginLeft: 'auto',
          padding: '0.1rem 0.6rem',
          borderRadius: '0.2rem',
          fontWeight: props.prefixActive ? 700 : 400,
          background: props.prefixActive
            ? props.theme.ui.accent
            : 'transparent',
          color: props.prefixActive ? props.theme.ui.accentFg : muted,
        }}
      >
        otheme
      </span>
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
          <span
            style={{
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              background: props.theme.ui.error,
            }}
          />
          <span
            style={{
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              background: props.theme.ui.warning,
            }}
          />
          <span
            style={{
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              background: props.theme.ui.success,
            }}
          />
          <span
            style={{
              marginLeft: '0.5rem',
              fontSize: '0.75rem',
              color: props.theme.ui.fgMuted,
            }}
          >
            {props.theme.name}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '0.85rem',
            overflow: 'auto',
          }}
        >
          <CodeRegion theme={props.theme} />
          <DiffRegion theme={props.theme} />
          <div style={{ marginTop: 'auto' }}>
            <TmuxBar theme={props.theme} prefixActive={prefixActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
