/**
 * Pre-tokenized code sample for the preview pane.
 *
 * Each token name maps directly to a key in SyntaxColors or to 'comment'
 * (ui.comment) or 'plain' (ui.fg). This lets the preview pane color every
 * span without pulling in a real syntax highlighter.
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

export type Span = { text: string; token: TokenKind };

export type SampleLine = Span[];

/** TypeScript + TSX snippet that exercises every syntax token. */
export const CODE_SAMPLE: SampleLine[] = [
  // import keyword, variable, string, punctuationSpecial
  [
    { text: 'import ', token: 'keyword' },
    { text: '{', token: 'punctuationSpecial' },
    { text: ' useState ', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
    { text: " from '", token: 'plain' },
    { text: 'react', token: 'string' },
    { text: "'", token: 'plain' },
  ],
  // blank line
  [{ text: '', token: 'plain' }],
  // type alias
  [
    { text: 'type ', token: 'keyword' },
    { text: 'Config', token: 'type' },
    { text: ' = ', token: 'operator' },
    { text: '{', token: 'punctuation' },
  ],
  // attribute (object key), type annotation
  [
    { text: '  ', token: 'plain' },
    { text: 'name', token: 'attribute' },
    { text: ': ', token: 'punctuation' },
    { text: 'string', token: 'type' },
    { text: ';', token: 'punctuation' },
  ],
  [
    { text: '  ', token: 'plain' },
    { text: 'retries', token: 'attribute' },
    { text: ': ', token: 'punctuation' },
    { text: 'number', token: 'type' },
    { text: ';', token: 'punctuation' },
  ],
  [{ text: '}', token: 'punctuation' }],
  // blank
  [{ text: '', token: 'plain' }],
  // const, constant
  [
    { text: 'const ', token: 'keyword' },
    { text: 'MAX_RETRIES', token: 'constant' },
    { text: ' = ', token: 'operator' },
    { text: '3', token: 'number' },
    { text: ';', token: 'punctuation' },
  ],
  // blank
  [{ text: '', token: 'plain' }],
  // comment
  [{ text: '/** Render a greeting card. */', token: 'comment' }],
  // function with generic type, variableBuiltin (this), punctuation
  [
    { text: 'function ', token: 'keyword' },
    { text: 'Card', token: 'func' },
    { text: '<', token: 'punctuation' },
    { text: 'T', token: 'type' },
    { text: '>(', token: 'punctuation' },
    { text: 'props', token: 'variable' },
    { text: ': ', token: 'punctuation' },
    { text: 'T', token: 'type' },
    { text: ') {', token: 'punctuation' },
  ],
  // variableBuiltin (console), variableMember (.log)
  [
    { text: '  ', token: 'plain' },
    { text: 'console', token: 'variableBuiltin' },
    { text: '.', token: 'punctuation' },
    { text: 'log', token: 'variableMember' },
    { text: '(', token: 'punctuation' },
    { text: 'props', token: 'variable' },
    { text: ');', token: 'punctuation' },
  ],
  // string with stringEscape and stringSpecial
  [
    { text: '  const ', token: 'keyword' },
    { text: 'msg', token: 'variable' },
    { text: ' = ', token: 'operator' },
    { text: '`Hello ', token: 'string' },
    { text: '\\n', token: 'stringEscape' },
    { text: '$', token: 'punctuationSpecial' },
    { text: '{', token: 'punctuationSpecial' },
    { text: 'name', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
    { text: '`', token: 'stringSpecial' },
    { text: ';', token: 'punctuation' },
  ],
  // return JSX — tag, attribute
  [{ text: '  return (', token: 'punctuation' }],
  [
    { text: '    <', token: 'punctuation' },
    { text: 'div', token: 'tag' },
    { text: ' ', token: 'plain' },
    { text: 'className', token: 'attribute' },
    { text: '=', token: 'operator' },
    { text: '"card"', token: 'string' },
    { text: '>', token: 'punctuation' },
  ],
  [
    { text: '      ', token: 'plain' },
    { text: '{', token: 'punctuationSpecial' },
    { text: 'msg', token: 'variable' },
    { text: '}', token: 'punctuationSpecial' },
  ],
  [
    { text: '    </', token: 'punctuation' },
    { text: 'div', token: 'tag' },
    { text: '>', token: 'punctuation' },
  ],
  [{ text: '  );', token: 'punctuation' }],
  [{ text: '}', token: 'punctuation' }],
];

/** Short markdown block to show markupHeading, markupLink, markupList. */
export const MARKDOWN_SAMPLE: SampleLine[] = [
  [{ text: '# README', token: 'markupHeading' }],
  [{ text: '', token: 'plain' }],
  [
    { text: '- ', token: 'markupList' },
    { text: 'Install with ', token: 'plain' },
    { text: '`bun install`', token: 'stringSpecial' },
  ],
  [
    { text: '- ', token: 'markupList' },
    { text: 'Docs: ', token: 'plain' },
    { text: '[otheme.dev](https://otheme.dev)', token: 'markupLink' },
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

export const PROMPT_README: PromptLine = {
  dir: '~/code/card',
  branch: 'main',
  command: 'cat README.md',
};

export const PROMPT_CODE: PromptLine = {
  dir: '~/code/card',
  branch: 'main',
  command: 'bat src/card.tsx',
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

/** Success line printed after `otheme set`. */
export const APPLY_SUCCESS = 'applied to nvim · tmux · ghostty · git-delta';
