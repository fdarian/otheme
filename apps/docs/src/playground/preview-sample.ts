/**
 * Pre-tokenized samples for the preview pane.
 *
 * The preview is framed as four tmux windows. Each window draws from its own
 * sample below, and the syntax/ui token coverage is spread across them:
 *   1:zsh    -> a shell session (git-delta diff + `otheme set` success)
 *   2:logs   -> a log stream exercising the semantic ui palette
 *   3:editor -> a TS/JSX file exercising every syntax token
 *   4:docs   -> a markdown doc exercising the markup tokens
 *
 * Each syntax token name maps directly to a key in SyntaxColors or to
 * 'comment' (ui.comment) or 'plain' (ui.fg), so the preview can color every
 * span without a real highlighter.
 */

export type TokenKind =
  | 'attribute'
  | 'comment'
  | 'constant'
  | 'func'
  | 'keyword'
  | 'markupHeading'
  | 'markupLink'
  | 'markupList'
  | 'number'
  | 'operator'
  | 'plain'
  | 'punctuation'
  | 'punctuationSpecial'
  | 'string'
  | 'stringEscape'
  | 'stringSpecial'
  | 'tag'
  | 'type'
  | 'variable'
  | 'variableBuiltin'
  | 'variableMember';

/**
 * An LSP-style diagnostic on a span: 'error' draws a wavy underline in
 * ui.error, 'unused' draws a wavy underline in ui.hint and dims the token
 * (like nvim's DiagnosticUnnecessary).
 */
export type SpanDiagnostic = 'error' | 'unused';

export type Span = {
  text: string;
  token: TokenKind;
  diagnostic?: SpanDiagnostic;
};

export type SampleLine = Span[];

/**
 * Window 3 (editor): a believable TS/TSX file that exercises every syntax
 * token — attribute, constant, func, keyword, number, operator, punctuation,
 * punctuationSpecial, string, stringEscape, stringSpecial, tag, type,
 * variable, variableBuiltin, variableMember (+ comment).
 */
export const CODE_SAMPLE: SampleLine[] = [
  [
    { text: 'import ', token: 'keyword' },
    { text: '{', token: 'punctuationSpecial' },
    { text: ' useState', token: 'variable' },
    { text: ', ', token: 'punctuation' },
    { text: 'useMemo ', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
    { text: " from '", token: 'plain' },
    { text: 'react', token: 'string' },
    { text: "'", token: 'plain' },
    { text: ';', token: 'punctuation' },
  ],
  [
    { text: 'import ', token: 'keyword' },
    { text: 'type ', token: 'keyword' },
    { text: '{', token: 'punctuationSpecial' },
    { text: ' User ', token: 'type' },
    { text: '}', token: 'punctuationSpecial' },
    { text: ' from ', token: 'plain' },
    { text: "'./user'", token: 'string', diagnostic: 'error' },
    { text: ';', token: 'punctuation' },
  ],
  [{ text: '', token: 'plain' }],
  [
    {
      text: '/** Maximum greetings before we rate-limit. */',
      token: 'comment',
    },
  ],
  [
    { text: 'const ', token: 'keyword' },
    { text: 'MAX_GREETINGS', token: 'constant', diagnostic: 'unused' },
    { text: ' = ', token: 'operator' },
    { text: '100', token: 'number' },
    { text: ';', token: 'punctuation' },
  ],
  [{ text: '', token: 'plain' }],
  [
    { text: 'type ', token: 'keyword' },
    { text: 'CardProps', token: 'type' },
    { text: ' = ', token: 'operator' },
    { text: '{', token: 'punctuation' },
  ],
  [
    { text: '  ', token: 'plain' },
    { text: 'user', token: 'attribute' },
    { text: ': ', token: 'punctuation' },
    { text: 'User', token: 'type' },
    { text: ';', token: 'punctuation' },
  ],
  [
    { text: '  ', token: 'plain' },
    { text: 'count', token: 'attribute' },
    { text: ': ', token: 'punctuation' },
    { text: 'number', token: 'type' },
    { text: ';', token: 'punctuation' },
  ],
  [{ text: '}', token: 'punctuation' }],
  [{ text: '', token: 'plain' }],
  [
    { text: 'export ', token: 'keyword' },
    { text: 'function ', token: 'keyword' },
    { text: 'Card', token: 'func' },
    { text: '(', token: 'punctuation' },
    { text: 'props', token: 'variable' },
    { text: ': ', token: 'punctuation' },
    { text: 'CardProps', token: 'type' },
    { text: ') {', token: 'punctuation' },
  ],
  [
    { text: '  const ', token: 'keyword' },
    { text: 'name', token: 'variable' },
    { text: ' = ', token: 'operator' },
    { text: 'props', token: 'variable' },
    { text: '.', token: 'punctuation' },
    { text: 'user', token: 'variableMember' },
    { text: '.', token: 'punctuation' },
    { text: 'name', token: 'variableMember' },
    { text: ';', token: 'punctuation' },
  ],
  [
    { text: '  const ', token: 'keyword' },
    { text: 'greeting', token: 'variable' },
    { text: ' = ', token: 'operator' },
    { text: '`Hi ', token: 'string' },
    { text: '$', token: 'punctuationSpecial' },
    { text: '{', token: 'punctuationSpecial' },
    { text: 'name', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
    { text: '!', token: 'string' },
    { text: '\\n', token: 'stringEscape' },
    { text: '`', token: 'stringSpecial' },
    { text: ';', token: 'punctuation' },
  ],
  [
    { text: '  ', token: 'plain' },
    { text: 'console', token: 'variableBuiltin' },
    { text: '.', token: 'punctuation' },
    { text: 'log', token: 'variableMember' },
    { text: '(', token: 'punctuation' },
    { text: 'greeting', token: 'variable' },
    { text: ');', token: 'punctuation' },
  ],
  [
    { text: '  const ', token: 'keyword' },
    { text: 'label', token: 'variable' },
    { text: ' = ', token: 'operator' },
    { text: 'useMemo', token: 'func' },
    { text: '(', token: 'punctuation' },
    { text: '() ', token: 'punctuation' },
    { text: '=>', token: 'operator' },
    { text: ' props', token: 'variable' },
    { text: '.', token: 'punctuation' },
    { text: 'count', token: 'variableMember' },
    { text: ', [', token: 'punctuation' },
    { text: 'props', token: 'variable' },
    { text: ']);', token: 'punctuation' },
  ],
  [{ text: '  return (', token: 'punctuation' }],
  [
    { text: '    <', token: 'punctuation' },
    { text: 'section', token: 'tag' },
    { text: ' ', token: 'plain' },
    { text: 'className', token: 'attribute' },
    { text: '=', token: 'operator' },
    { text: '"card"', token: 'string' },
    { text: '>', token: 'punctuation' },
  ],
  [
    { text: '      <', token: 'punctuation' },
    { text: 'h2', token: 'tag' },
    { text: '>', token: 'punctuation' },
    { text: '{', token: 'punctuationSpecial' },
    { text: 'greeting', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
    { text: '</', token: 'punctuation' },
    { text: 'h2', token: 'tag' },
    { text: '>', token: 'punctuation' },
  ],
  [
    { text: '      <', token: 'punctuation' },
    { text: 'span', token: 'tag' },
    { text: '>', token: 'punctuation' },
    { text: '{', token: 'punctuationSpecial' },
    { text: 'label', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
    { text: '</', token: 'punctuation' },
    { text: 'span', token: 'tag' },
    { text: '>', token: 'punctuation' },
  ],
  [
    { text: '    </', token: 'punctuation' },
    { text: 'section', token: 'tag' },
    { text: '>', token: 'punctuation' },
  ],
  [{ text: '  );', token: 'punctuation' }],
  [{ text: '}', token: 'punctuation' }],
];

/**
 * LSP-style trailing virtual text shown to the right of a CODE_SAMPLE line,
 * keyed by line index. 'error' lines render in ui.error, 'hint' in ui.hint.
 */
export type CodeDiagnostic = { severity: 'error' | 'hint'; message: string };

export const CODE_DIAGNOSTICS: Record<number, CodeDiagnostic> = {
  // import type { User } from './user';
  1: {
    severity: 'error',
    message:
      "Cannot find module './user' or its corresponding type declarations.",
  },
  // const MAX_GREETINGS = 100;
  4: {
    severity: 'hint',
    message: "'MAX_GREETINGS' is declared but its value is never read.",
  },
};

/**
 * Window 4 (docs): a fuller markdown doc — headings, a paragraph with a link,
 * a bullet list, a numbered list, inline code, a fenced code block, and a
 * blockquote — exercising markupHeading / markupLink / markupList.
 */
export const MARKDOWN_SAMPLE: SampleLine[] = [
  [{ text: '# otheme', token: 'markupHeading' }],
  [{ text: '', token: 'plain' }],
  [
    { text: 'One theme JSON, every tool. See ', token: 'plain' },
    { text: '[the docs](https://otheme.dev)', token: 'markupLink' },
    { text: ' to start.', token: 'plain' },
  ],
  [{ text: '', token: 'plain' }],
  [{ text: '## Targets', token: 'markupHeading' }],
  [{ text: '', token: 'plain' }],
  [
    { text: '- ', token: 'markupList' },
    { text: 'nvim, tmux, ghostty, git-delta', token: 'plain' },
  ],
  [
    { text: '- ', token: 'markupList' },
    { text: 'Run ', token: 'plain' },
    { text: '`otheme set <name>`', token: 'stringSpecial' },
    { text: ' to apply.', token: 'plain' },
  ],
  [{ text: '', token: 'plain' }],
  [{ text: '## Quick start', token: 'markupHeading' }],
  [{ text: '', token: 'plain' }],
  [
    { text: '1. ', token: 'markupList' },
    { text: 'Install with ', token: 'plain' },
    { text: '`bun install`', token: 'stringSpecial' },
  ],
  [
    { text: '2. ', token: 'markupList' },
    { text: 'Pick a preset above', token: 'plain' },
  ],
  [{ text: '', token: 'plain' }],
  [{ text: '```sh', token: 'comment' }],
  [
    { text: 'otheme set ', token: 'plain' },
    { text: 'vesper', token: 'string' },
  ],
  [{ text: '```', token: 'comment' }],
  [{ text: '', token: 'plain' }],
  [
    { text: '> ', token: 'markupList' },
    {
      text: 'Tip: keep your palette JSON in version control.',
      token: 'comment',
    },
  ],
];

/** Lines for the git-delta diff region. */
export type DiffSpan = { text: string; kind: 'plain' | 'emphasis' };

export type DiffLine = {
  type: 'hunk' | 'context' | 'removed' | 'added';
  lineNrOld: string;
  lineNrNew: string;
  spans: DiffSpan[];
};

export const DIFF_SAMPLE: DiffLine[] = [
  {
    type: 'hunk',
    lineNrOld: '',
    lineNrNew: '',
    spans: [
      {
        text: '@@ -12,7 +12,7 @@ function greet(name: string) {',
        kind: 'plain',
      },
    ],
  },
  {
    type: 'context',
    lineNrOld: '12',
    lineNrNew: '12',
    spans: [{ text: '  const prefix = "Hello";', kind: 'plain' }],
  },
  {
    type: 'removed',
    lineNrOld: '13',
    lineNrNew: '',
    spans: [
      { text: '  return prefix + ', kind: 'plain' },
      { text: '" " + name', kind: 'emphasis' },
      { text: ';', kind: 'plain' },
    ],
  },
  {
    type: 'added',
    lineNrNew: '13',
    lineNrOld: '',
    spans: [
      { text: '  return [prefix, ', kind: 'plain' },
      { text: 'name].join(" ")', kind: 'emphasis' },
      { text: ';', kind: 'plain' },
    ],
  },
  {
    type: 'context',
    lineNrOld: '14',
    lineNrNew: '14',
    spans: [{ text: '}', kind: 'plain' }],
  },
];

/** A zsh-style prompt line: a directory segment, a git branch, and the typed command. */
export type PromptLine = { dir: string; branch: string; command: string };

export const PROMPT_DIFF: PromptLine = {
  dir: '~/code/card',
  branch: 'main',
  command: 'git diff',
};

export const PROMPT_APPLY: PromptLine = {
  dir: '~/code/card',
  branch: 'main',
  command: 'otheme set vesper',
};

/** Trailing prompt with a blinking cursor at the end of the shell window. */
export const PROMPT_TRAIL: PromptLine = {
  dir: '~/code/card',
  branch: 'main',
  command: '',
};

/** Success line printed after `otheme set`. */
export const APPLY_SUCCESS = 'applied to nvim · tmux · ghostty · git-delta';

/**
 * Window 2 (logs): a build/server log stream. Each segment names the semantic
 * ui field that drives its color, so the window exercises ui.info, ui.warning,
 * ui.error, ui.success, ui.fgMuted (timestamps/DEBUG) and ui.hint (notices).
 */
export type LogUiKey =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'fgMuted'
  | 'hint'
  | 'fg';

export type LogSpan = { text: string; ui: LogUiKey };

export type LogLine = LogSpan[];

export const LOG_SAMPLE: LogLine[] = [
  [
    { text: '12:01:31 ', ui: 'fgMuted' },
    { text: 'INFO  ', ui: 'info' },
    { text: 'otheme build starting (mode=production)', ui: 'fg' },
  ],
  [
    { text: '12:01:31 ', ui: 'fgMuted' },
    { text: 'DEBUG ', ui: 'fgMuted' },
    { text: 'resolved 4 targets: nvim, tmux, ghostty, delta', ui: 'fgMuted' },
  ],
  [
    { text: '12:01:32 ', ui: 'fgMuted' },
    { text: 'INFO  ', ui: 'info' },
    { text: 'loaded palette vesper (40 fields)', ui: 'fg' },
  ],
  [
    { text: '12:01:32 ', ui: 'fgMuted' },
    { text: 'HINT  ', ui: 'hint' },
    { text: 'set OTHEME_CACHE=1 to skip unchanged targets', ui: 'hint' },
  ],
  [
    { text: '12:01:33 ', ui: 'fgMuted' },
    { text: 'OK    ', ui: 'success' },
    { text: 'wrote ~/.config/nvim/colors/vesper.lua', ui: 'fg' },
  ],
  [
    { text: '12:01:33 ', ui: 'fgMuted' },
    { text: 'OK    ', ui: 'success' },
    { text: 'wrote ~/.config/tmux/vesper.conf', ui: 'fg' },
  ],
  [
    { text: '12:01:34 ', ui: 'fgMuted' },
    { text: 'WARN  ', ui: 'warning' },
    { text: 'ghostty config already managed, merging keys', ui: 'fg' },
  ],
  [
    { text: '12:01:34 ', ui: 'fgMuted' },
    { text: 'OK    ', ui: 'success' },
    { text: 'wrote ~/.config/ghostty/themes/vesper', ui: 'fg' },
  ],
  [
    { text: '12:01:35 ', ui: 'fgMuted' },
    { text: 'ERROR ', ui: 'error' },
    { text: 'delta: ~/.gitconfig not writable, skipped', ui: 'fg' },
  ],
  [
    { text: '12:01:35 ', ui: 'fgMuted' },
    { text: 'HINT  ', ui: 'hint' },
    {
      text: 'fix with: chmod u+w ~/.gitconfig && otheme set vesper',
      ui: 'hint',
    },
  ],
  [
    { text: '12:01:36 ', ui: 'fgMuted' },
    { text: 'INFO  ', ui: 'info' },
    { text: 'server listening on :3000', ui: 'fg' },
  ],
  [
    { text: '12:01:36 ', ui: 'fgMuted' },
    { text: 'OK    ', ui: 'success' },
    { text: 'build finished in 1.84s (3/4 targets)', ui: 'fg' },
  ],
];
