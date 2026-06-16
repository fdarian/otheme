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

export type SpanDiagnostic = 'error' | 'unused';

export type Span = {
  text: string;
  token: TokenKind;
  diagnostic?: SpanDiagnostic;
};

export type SampleLine = Span[];

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

export type CodeDiagnostic = {
  severity: 'error' | 'hint';
  message: string;
};

export const CODE_DIAGNOSTICS: Record<number, CodeDiagnostic> = {
  1: {
    severity: 'error',
    message:
      "Cannot find module './user' or its corresponding type declarations.",
  },
  4: {
    severity: 'hint',
    message: "'MAX_GREETINGS' is declared but its value is never read.",
  },
};

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

export type DiffSpan = {
  text: string;
  kind: 'plain' | 'emphasis';
};

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
    lineNrOld: '',
    lineNrNew: '13',
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

export type PromptLine = {
  dir: string;
  branch: string;
  command: string;
};

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

export const PROMPT_TRAIL: PromptLine = {
  dir: '~/code/card',
  branch: 'main',
  command: '',
};

export const APPLY_SUCCESS = 'applied to nvim · tmux · ghostty · git-delta';

export type LogUiKey =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'fgMuted'
  | 'hint'
  | 'fg';

export type LogSpan = {
  text: string;
  ui: LogUiKey;
};

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
