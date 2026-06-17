import type { Theme } from '@otheme/core/schema';
import { Eye, Keyboard } from 'lucide-react';
import { useState } from 'react';
import type {
  CodeDiagnostic,
  DiffLine,
  DiffSpan,
  LogLine,
  LogUiKey,
  PromptLine,
  SampleLine,
  Span,
  SpanDiagnostic,
  TokenKind,
} from '#/components/playground/preview-sample';
import {
  APPLY_SUCCESS,
  CODE_DIAGNOSTICS,
  CODE_SAMPLE,
  DIFF_SAMPLE,
  LOG_SAMPLE,
  MARKDOWN_SAMPLE,
  PROMPT_APPLY,
  PROMPT_DIFF,
  PROMPT_TRAIL,
} from '#/components/playground/preview-sample';
import type {
  PaletteField,
  PreviewPaneProps,
} from '#/components/playground/types';
import { Button } from '#/components/ui/button';
import { cn } from '#/lib/utils';

const MONO_FONT =
  'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

type HoverTarget = {
  field: PaletteField;
  rect: DOMRect;
};

type InspectContext = {
  active: boolean;
  onHover: (target: HoverTarget | null) => void;
  onInspect: (field: PaletteField) => void;
};

const INSPECTABLE_CLASS = 'otheme-inspectable';

function tokenColor(theme: Theme, token: TokenKind) {
  if (token === 'plain') return theme.ui.fg;
  if (token === 'comment') return theme.ui.comment;
  return theme.syntax[token];
}

function tokenField(token: TokenKind): PaletteField {
  if (token === 'plain') return { group: 'ui', key: 'fg' };
  if (token === 'comment') return { group: 'ui', key: 'comment' };
  return { group: 'syntax', key: token };
}

function diagnosticKey(severity: SpanDiagnostic | CodeDiagnostic['severity']) {
  return severity === 'error' ? 'error' : 'hint';
}

function tmuxMuted(theme: Theme) {
  return theme.targets.tmux?.muted ?? theme.ui.fgMuted;
}

function diffRowBackground(theme: Theme, type: DiffLine['type']) {
  if (type === 'removed') return theme.ui.diffDel;
  if (type === 'added') return theme.ui.diffAdd;
  return theme.ui.bg;
}

function emphasisBackground(theme: Theme, type: DiffLine['type']) {
  if (type === 'removed') return theme.ui.error;
  if (type === 'added') return theme.ui.success;
  return 'transparent';
}

function gutterColor(theme: Theme, type: DiffLine['type']) {
  if (type === 'removed') return theme.ui.error;
  if (type === 'added') return theme.ui.success;
  return theme.ui.lineNr;
}

function diffRowBackgroundField(type: DiffLine['type']): PaletteField {
  if (type === 'removed') return { group: 'ui', key: 'diffDel' };
  if (type === 'added') return { group: 'ui', key: 'diffAdd' };
  return { group: 'ui', key: 'bg' };
}

function gutterColorField(type: DiffLine['type']): PaletteField {
  if (type === 'removed') return { group: 'ui', key: 'error' };
  if (type === 'added') return { group: 'ui', key: 'success' };
  return { group: 'ui', key: 'lineNr' };
}

function emphasisField(type: DiffLine['type']): PaletteField {
  if (type === 'removed') return { group: 'ui', key: 'error' };
  if (type === 'added') return { group: 'ui', key: 'success' };
  return { group: 'ui', key: 'fg' };
}

function InspectableSpan(props: {
  children: React.ReactNode;
  color: string;
  field: PaletteField;
  inspect: InspectContext;
  style?: React.CSSProperties;
}) {
  const baseStyle: React.CSSProperties = { color: props.color, ...props.style };

  if (!props.inspect.active) {
    return <span style={baseStyle}>{props.children}</span>;
  }

  function reportHover(event: React.MouseEvent<HTMLSpanElement>) {
    props.inspect.onHover({
      field: props.field,
      rect: event.currentTarget.getBoundingClientRect(),
    });
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: keeping the same inline span preserves identical token layout between inspect modes
    <span
      className={INSPECTABLE_CLASS}
      role="button"
      tabIndex={0}
      onBlur={() => props.inspect.onHover(null)}
      onClick={() => props.inspect.onInspect(props.field)}
      onFocus={(event) =>
        props.inspect.onHover({
          field: props.field,
          rect: event.currentTarget.getBoundingClientRect(),
        })
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          props.inspect.onInspect(props.field);
        }
      }}
      onMouseEnter={reportHover}
      onMouseLeave={() => props.inspect.onHover(null)}
      onMouseMove={reportHover}
      style={baseStyle}
    >
      {props.children}
    </span>
  );
}

/** The palette color a field points at — what click-to-focus will edit. */
function fieldColor(theme: Theme, field: PaletteField) {
  const palette = field.group === 'ui' ? theme.ui : theme.syntax;
  return (palette as Record<string, string>)[field.key];
}

function InspectTooltip(props: { target: HoverTarget; theme: Theme }) {
  const hex = fieldColor(props.theme, props.target.field);
  return (
    <div
      className="fixed z-50 flex items-center gap-2 rounded-md border bg-popover px-2.5 py-1.5 font-mono text-[11px] text-popover-foreground shadow-md"
      style={{
        left: props.target.rect.left,
        pointerEvents: 'none',
        top: props.target.rect.bottom + 6,
      }}
    >
      <span>{`${props.target.field.group}.${props.target.field.key}`}</span>
      <span
        className="size-3 rounded-[3px] border"
        style={{ background: hex }}
      />
      <span className="text-muted-foreground">{hex}</span>
    </div>
  );
}

function CodeToken(props: {
  inspect: InspectContext;
  span: Span;
  theme: Theme;
}) {
  if (props.span.diagnostic === undefined) {
    return (
      <InspectableSpan
        color={tokenColor(props.theme, props.span.token)}
        field={tokenField(props.span.token)}
        inspect={props.inspect}
      >
        {props.span.text}
      </InspectableSpan>
    );
  }

  const key = diagnosticKey(props.span.diagnostic);
  const underline = props.theme.ui[key];
  const textColor =
    props.span.diagnostic === 'unused'
      ? props.theme.ui.fgMuted
      : tokenColor(props.theme, props.span.token);

  return (
    <InspectableSpan
      color={textColor}
      field={{ group: 'ui', key }}
      inspect={props.inspect}
      style={{
        textDecoration: `underline wavy ${underline}`,
        textUnderlineOffset: '0.2rem',
      }}
    >
      {props.span.text}
    </InspectableSpan>
  );
}

function VirtualText(props: {
  diagnostic: CodeDiagnostic;
  inspect: InspectContext;
  theme: Theme;
}) {
  const key = diagnosticKey(props.diagnostic.severity);
  const color = props.theme.ui[key];

  return (
    <InspectableSpan
      color={color}
      field={{ group: 'ui', key }}
      inspect={props.inspect}
      style={{ opacity: 0.9, paddingLeft: '1.5rem' }}
    >
      ■ {props.diagnostic.message}
    </InspectableSpan>
  );
}

function CodeLines(props: {
  diagnostics?: Record<number, CodeDiagnostic>;
  inspect: InspectContext;
  lines: SampleLine[];
  startLine: number;
  theme: Theme;
}) {
  return (
    <>
      {props.lines.map((line, index) => {
        const diagnostic = props.diagnostics?.[index];

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
            key={index}
            style={{ display: 'flex', whiteSpace: 'pre' }}
          >
            <InspectableSpan
              color={props.theme.ui.lineNr}
              field={{ group: 'ui', key: 'lineNr' }}
              inspect={props.inspect}
              style={{
                minWidth: '2.5rem',
                paddingRight: '1rem',
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {props.startLine + index}
            </InspectableSpan>
            <span>
              {line.map((span, spanIndex) => (
                <CodeToken
                  // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
                  key={spanIndex}
                  inspect={props.inspect}
                  span={span}
                  theme={props.theme}
                />
              ))}
              {diagnostic !== undefined && (
                <VirtualText
                  diagnostic={diagnostic}
                  inspect={props.inspect}
                  theme={props.theme}
                />
              )}
            </span>
          </div>
        );
      })}
    </>
  );
}

function Prompt(props: {
  cursor?: boolean;
  inspect: InspectContext;
  prompt: PromptLine;
  theme: Theme;
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
            background: props.theme.ui.accent,
            display: 'inline-block',
            height: '1.05rem',
            width: '0.55rem',
          }}
        >
          {' '}
        </InspectableSpan>
      )}
    </div>
  );
}

function LogLines(props: {
  inspect: InspectContext;
  lines: LogLine[];
  theme: Theme;
}) {
  function logColor(theme: Theme, ui: LogUiKey) {
    return theme.ui[ui];
  }

  return (
    <div>
      {props.lines.map((line, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
          key={index}
          style={{ whiteSpace: 'pre' }}
        >
          {line.map((segment, segmentIndex) => (
            <InspectableSpan
              // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
              key={segmentIndex}
              color={logColor(props.theme, segment.ui)}
              field={{ group: 'ui', key: segment.ui }}
              inspect={props.inspect}
            >
              {segment.text}
            </InspectableSpan>
          ))}
        </div>
      ))}
    </div>
  );
}

function DiffSpanText(props: {
  inspect: InspectContext;
  span: DiffSpan;
  theme: Theme;
  type: DiffLine['type'];
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
  inspect: InspectContext;
  line: DiffLine;
  theme: Theme;
}) {
  if (props.line.type === 'hunk') {
    return (
      <div
        style={{
          background: props.theme.ui.bg,
          color: props.theme.ui.fgMuted,
          padding: '0.05rem 0',
          whiteSpace: 'pre',
        }}
      >
        {props.line.spans.map((span, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
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
        background: diffRowBackground(props.theme, props.line.type),
        display: 'flex',
        padding: '0.05rem 0',
        whiteSpace: 'pre',
      }}
    >
      <InspectableSpan
        color={gutterColor(props.theme, props.line.type)}
        field={gutterField}
        inspect={props.inspect}
        style={{
          minWidth: '2.25rem',
          paddingRight: '0.5rem',
          textAlign: 'right',
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
          paddingRight: '1rem',
          textAlign: 'right',
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
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
            key={index}
            inspect={props.inspect}
            span={span}
            theme={props.theme}
            type={props.line.type}
          />
        ))}
      </InspectableSpan>
    </div>
  );
}

function DiffRegion(props: { inspect: InspectContext; theme: Theme }) {
  return (
    <div>
      {DIFF_SAMPLE.map((line, index) => (
        <DiffRow
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
          key={index}
          inspect={props.inspect}
          line={line}
          theme={props.theme}
        />
      ))}
    </div>
  );
}

function OutputLines(props: {
  inspect: InspectContext;
  lines: SampleLine[];
  theme: Theme;
}) {
  return (
    <div>
      {props.lines.map((line, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
          key={index}
          style={{ whiteSpace: 'pre' }}
        >
          {line.map((span, spanIndex) => (
            <InspectableSpan
              // biome-ignore lint/suspicious/noArrayIndexKey: static sample data
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

function SuccessLine(props: { inspect: InspectContext; theme: Theme }) {
  return (
    <InspectableSpan
      color={props.theme.ui.success}
      field={{ group: 'ui', key: 'success' }}
      inspect={props.inspect}
      style={{ display: 'block', whiteSpace: 'pre' }}
    >
      ✓ {APPLY_SUCCESS}
    </InspectableSpan>
  );
}

type WindowId = 'zsh' | 'logs' | 'editor' | 'docs';

const WINDOW_TABS: { id: WindowId; label: string }[] = [
  { id: 'zsh', label: '1:zsh' },
  { id: 'logs', label: '2:logs' },
  { id: 'editor', label: '3:editor' },
  { id: 'docs', label: '4:docs' },
];

function WindowBody(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        fontSize: '0.8rem',
        lineHeight: 1.6,
        minHeight: 0,
        overflow: 'auto',
        padding: '0.85rem',
      }}
    >
      {props.children}
    </div>
  );
}

function ShellWindow(props: { inspect: InspectContext; theme: Theme }) {
  return (
    <WindowBody>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div>
          <Prompt
            inspect={props.inspect}
            prompt={PROMPT_DIFF}
            theme={props.theme}
          />
          <DiffRegion inspect={props.inspect} theme={props.theme} />
        </div>
        <div>
          <Prompt
            inspect={props.inspect}
            prompt={PROMPT_APPLY}
            theme={props.theme}
          />
          <SuccessLine inspect={props.inspect} theme={props.theme} />
        </div>
        <Prompt
          cursor
          inspect={props.inspect}
          prompt={PROMPT_TRAIL}
          theme={props.theme}
        />
      </div>
    </WindowBody>
  );
}

function LogsWindow(props: { inspect: InspectContext; theme: Theme }) {
  return (
    <WindowBody>
      <LogLines
        inspect={props.inspect}
        lines={LOG_SAMPLE}
        theme={props.theme}
      />
    </WindowBody>
  );
}

function EditorWindow(props: { inspect: InspectContext; theme: Theme }) {
  return (
    <WindowBody>
      <CodeLines
        diagnostics={CODE_DIAGNOSTICS}
        inspect={props.inspect}
        lines={CODE_SAMPLE}
        startLine={1}
        theme={props.theme}
      />
    </WindowBody>
  );
}

function DocsWindow(props: { inspect: InspectContext; theme: Theme }) {
  return (
    <WindowBody>
      <OutputLines
        inspect={props.inspect}
        lines={MARKDOWN_SAMPLE}
        theme={props.theme}
      />
    </WindowBody>
  );
}

function ActiveWindow(props: {
  inspect: InspectContext;
  theme: Theme;
  window: WindowId;
}) {
  if (props.window === 'zsh') {
    return <ShellWindow inspect={props.inspect} theme={props.theme} />;
  }

  if (props.window === 'logs') {
    return <LogsWindow inspect={props.inspect} theme={props.theme} />;
  }

  if (props.window === 'editor') {
    return <EditorWindow inspect={props.inspect} theme={props.theme} />;
  }

  return <DocsWindow inspect={props.inspect} theme={props.theme} />;
}

function WindowTab(props: {
  active: boolean;
  inspect: InspectContext;
  label: string;
  onSelect: () => void;
  theme: Theme;
}) {
  const color = props.active ? props.theme.ui.accent : tmuxMuted(props.theme);
  const field: PaletteField = props.active
    ? { group: 'ui', key: 'accent' }
    : { group: 'ui', key: 'fgMuted' };

  function reportHover(element: HTMLButtonElement) {
    props.inspect.onHover({
      field,
      rect: element.getBoundingClientRect(),
    });
  }

  return (
    <button
      type="button"
      aria-pressed={props.active}
      className={props.inspect.active ? INSPECTABLE_CLASS : undefined}
      onBlur={
        props.inspect.active ? () => props.inspect.onHover(null) : undefined
      }
      onClick={
        props.inspect.active
          ? () => props.inspect.onInspect(field)
          : props.onSelect
      }
      onFocus={
        props.inspect.active
          ? (event) => reportHover(event.currentTarget)
          : undefined
      }
      onMouseEnter={
        props.inspect.active
          ? (event) => reportHover(event.currentTarget)
          : undefined
      }
      onMouseLeave={
        props.inspect.active ? () => props.inspect.onHover(null) : undefined
      }
      onMouseMove={
        props.inspect.active
          ? (event) => reportHover(event.currentTarget)
          : undefined
      }
      style={{
        all: 'unset',
        borderRadius: '0.15rem',
        color,
        cursor: 'pointer',
        fontWeight: props.active ? 700 : 400,
        padding: '0 0.1rem',
      }}
    >
      {props.label}
    </button>
  );
}

function TmuxBar(props: {
  activeWindow: WindowId;
  inspect: InspectContext;
  onSelectWindow: (window: WindowId) => void;
  prefixActive: boolean;
  theme: Theme;
}) {
  const muted = tmuxMuted(props.theme);
  const mutedField: PaletteField = { group: 'ui', key: 'fgMuted' };

  return (
    <div
      style={{
        alignItems: 'center',
        background: props.theme.ui.bg,
        borderBottom: `1px solid ${props.theme.ui.border}`,
        display: 'flex',
        fontSize: '0.8rem',
        gap: '1rem',
        padding: '0.4rem 0.85rem',
      }}
    >
      {WINDOW_TABS.map((tab) => (
        <WindowTab
          key={tab.id}
          active={props.activeWindow === tab.id}
          inspect={props.inspect}
          label={tab.label}
          onSelect={() => props.onSelectWindow(tab.id)}
          theme={props.theme}
        />
      ))}
      <InspectableSpan
        color={props.prefixActive ? props.theme.ui.accentFg : muted}
        field={
          props.prefixActive ? { group: 'ui', key: 'accentFg' } : mutedField
        }
        inspect={props.inspect}
        style={{
          background: props.prefixActive
            ? props.theme.ui.accent
            : 'transparent',
          borderRadius: '0.2rem',
          fontWeight: props.prefixActive ? 700 : 400,
          marginLeft: 'auto',
          padding: '0.1rem 0.6rem',
        }}
      >
        otheme
      </InspectableSpan>
    </div>
  );
}

function ToggleButton(props: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn(
        'h-8 rounded-md px-3 text-xs font-medium',
        props.active
          ? 'border-border bg-accent text-accent-foreground shadow-none'
          : 'bg-background text-muted-foreground shadow-none',
      )}
      size="sm"
      variant="outline"
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}

export function PreviewPane(props: PreviewPaneProps) {
  const [prefixActive, setPrefixActive] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowId>('zsh');
  const [hovered, setHovered] = useState<HoverTarget | null>(null);

  const inspect: InspectContext = {
    active: props.inspectMode,
    onHover: setHovered,
    onInspect: props.onInspect,
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <style>{`
        .${INSPECTABLE_CLASS} {
          border-radius: 0.2rem;
          cursor: pointer;
          transition: background 80ms ease;
        }
        .${INSPECTABLE_CLASS}:hover {
          background: rgba(128, 128, 128, 0.22);
        }
      `}</style>

      <div className="border-b bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleButton
            active={prefixActive}
            onClick={() => setPrefixActive((previous) => !previous)}
          >
            <Keyboard className="size-3.5" />
            prefix active
          </ToggleButton>
          <ToggleButton
            active={props.inspectMode}
            onClick={props.onToggleInspect}
          >
            <Eye className="size-3.5" />
            Inspect
          </ToggleButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <div
          style={{
            background: props.theme.ui.bg,
            border: `1px solid ${props.theme.ui.border}`,
            borderRadius: '0.6rem',
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            color: props.theme.ui.fg,
            cursor: props.inspectMode ? 'cell' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: MONO_FONT,
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              background: props.theme.ui.bgFloat,
              borderBottom: `1px solid ${props.theme.ui.border}`,
              display: 'flex',
              gap: '0.4rem',
              padding: '0.55rem 0.85rem',
            }}
          >
            <InspectableSpan
              color={props.theme.ui.error}
              field={{ group: 'ui', key: 'error' }}
              inspect={inspect}
              style={{
                background: props.theme.ui.error,
                borderRadius: '999px',
                display: 'inline-block',
                height: '0.7rem',
                width: '0.7rem',
              }}
            >
              {''}
            </InspectableSpan>
            <InspectableSpan
              color={props.theme.ui.warning}
              field={{ group: 'ui', key: 'warning' }}
              inspect={inspect}
              style={{
                background: props.theme.ui.warning,
                borderRadius: '999px',
                display: 'inline-block',
                height: '0.7rem',
                width: '0.7rem',
              }}
            >
              {''}
            </InspectableSpan>
            <InspectableSpan
              color={props.theme.ui.success}
              field={{ group: 'ui', key: 'success' }}
              inspect={inspect}
              style={{
                background: props.theme.ui.success,
                borderRadius: '999px',
                display: 'inline-block',
                height: '0.7rem',
                width: '0.7rem',
              }}
            >
              {''}
            </InspectableSpan>
            <InspectableSpan
              color={props.theme.ui.fgMuted}
              field={{ group: 'ui', key: 'fgMuted' }}
              inspect={inspect}
              style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}
            >
              {props.theme.name}
            </InspectableSpan>
          </div>

          <TmuxBar
            activeWindow={activeWindow}
            inspect={inspect}
            onSelectWindow={setActiveWindow}
            prefixActive={prefixActive}
            theme={props.theme}
          />

          <ActiveWindow
            inspect={inspect}
            theme={props.theme}
            window={activeWindow}
          />
        </div>
      </div>

      {props.inspectMode && hovered !== null && (
        <InspectTooltip target={hovered} theme={props.theme} />
      )}
    </div>
  );
}
