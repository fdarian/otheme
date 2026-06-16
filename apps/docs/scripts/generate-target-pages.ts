import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  loadTheme,
  type PlannedCommand,
  type PlannedCreate,
  type TargetAdapter,
  targetAdapters,
} from '@otheme/core';
import { Effect } from 'effect';

type TargetPageConfig = {
  readonly compatibility: string;
  readonly extraSections?: string;
  readonly id: TargetAdapter['id'];
  readonly intro: string;
  readonly slug: string;
  readonly title: string;
};

const representativeThemeId = 'vesper';
const generatedNotice =
  'This page is generated from the adapter plan used by `otheme set vesper --dry-run`. Paths are shown exactly as otheme prints them; `~` means your home directory.';

const targetPageConfigs = [
  {
    compatibility:
      'Author mode. otheme generates a Neovim colorscheme file from the shared theme palette, then asks running Neovim instances to switch to it.',
    id: 'nvim',
    intro:
      'The nvim target writes a generated Lua colorscheme and live-applies it to running Neovim instances when possible.',
    slug: 'nvim',
    title: 'nvim',
  },
  {
    compatibility:
      'Author mode. otheme generates a tmux theme file from the shared theme palette and points tmux at it.',
    extraSections: `## Session name formatting

By default, otheme renders the tmux status bar with the plain session name (\`#{session_name}\`).

You can customize this via the \`overrides\` field in \`~/.config/otheme/config.json\`:

### \`sessionFormatter\`

Run a custom binary to format the session name. otheme injects it as \`#(<formatter> '#{session_name}')\` in both the prefix and non-prefix branches of the status right.

\`\`\`json
{
  "overrides": {
    "vesper": {
      "tmux": {
        "sessionFormatter": "~/.config/tmux/tools/format-session/target/release/format-session"
      }
    }
  }
}
\`\`\`

### \`statusRight\`

Replace the entire status-right string. Supports \`{{placeholder}}\` substitution (e.g. \`{{accent}}\`, \`{{muted}}\`). This wins over \`sessionFormatter\` when both are set.

\`\`\`json
{
  "overrides": {
    "vesper": {
      "tmux": {
        "statusRight": "#[fg={{muted}}]my custom status"
      }
    }
  }
}
\`\`\``,
    id: 'tmux',
    intro:
      'The tmux target writes a generated tmux theme file, updates the active source line, and reloads tmux.\n\nBy default the status bar shows the plain tmux session name (`#{session_name}`). You can override this per theme — see [Session name formatting](#session-name-formatting) below.',
    slug: 'tmux',
    title: 'tmux',
  },
  {
    compatibility:
      'Author and map modes. In author mode, otheme writes a Ghostty theme file and sets `theme = otheme-<theme-id>`. In map mode, it sets `theme = <mapTo>` to use an existing Ghostty theme name. The built-in themes currently use map mode.',
    id: 'ghostty',
    intro:
      'The ghostty target updates Ghostty config and reloads running Ghostty processes. For built-in themes, it maps to existing Ghostty theme names.',
    slug: 'ghostty',
    title: 'ghostty',
  },
  {
    compatibility:
      'Map mode. otheme sets Claude Code to an existing appearance value: `light` or `dark`.',
    id: 'claude-code',
    intro:
      'The claude-code target updates Claude Code settings JSON while preserving other settings.',
    slug: 'claude-code',
    title: 'claude-code',
  },
  {
    compatibility:
      'Author mode. otheme writes a dedicated git include file with a `[delta]` section, deriving diff colors from the shared palette and setting the `features` field to a named delta theme.',
    id: 'git-delta',
    intro:
      'The git-delta target writes ~/.config/git/otheme-delta.conf with palette-derived diff colors and ensures ~/.gitconfig includes it.',
    slug: 'git-delta',
    title: 'git-delta',
  },
  {
    compatibility:
      "Command mode. otheme runs an osascript one-liner to set the macOS system appearance to match the theme's top-level `appearance` field.",
    id: 'macos',
    intro:
      'The macos target switches the macOS system appearance (dark or light) to match the active theme.',
    slug: 'macos',
    title: 'macos',
  },
] as const satisfies ReadonlyArray<TargetPageConfig>;

const escapeTableCell = (value: string): string => value.replaceAll('|', '\\|');

const fileRows = (creates: ReadonlyArray<PlannedCreate>): string => {
  if (creates.length === 0) {
    return 'No files are written for this target.';
  }

  return [
    '| Order | File | What otheme writes |',
    '| --- | --- | --- |',
    ...creates.map(
      (create, index) =>
        `| ${index + 1} | \`${escapeTableCell(create.path)}\` | ${escapeTableCell(create.summary)} |`,
    ),
  ].join('\n');
};

const commandRows = (commands: ReadonlyArray<PlannedCommand>): string => {
  if (commands.length === 0) {
    return 'No shell commands are run for this target.';
  }

  return [
    '| Order | Command | Why it runs |',
    '| --- | --- | --- |',
    ...commands.map(
      (command, index) =>
        `| ${index + 1} | \`${escapeTableCell(command.cmd)}\` | ${escapeTableCell(command.why)} |`,
    ),
  ].join('\n');
};

const findAdapter = (targetId: TargetAdapter['id']) =>
  Effect.gen(function* () {
    for (const adapter of targetAdapters) {
      if (adapter.id === targetId) {
        return adapter;
      }
    }

    return yield* Effect.fail(
      new Error(`Could not find adapter for docs target ${targetId}`),
    );
  });

const renderTargetPage = (config: TargetPageConfig) =>
  Effect.gen(function* () {
    const theme = yield* loadTheme(representativeThemeId);
    const adapter = yield* findAdapter(config.id);
    const plan = adapter.plan(theme);

    return `---
title: ${config.title}
description: Files and commands used by the ${config.title} target.
---

# ${config.title}

${config.intro}

${generatedNotice}

## Compatibility

${config.compatibility}

## Files

${fileRows(plan.creates)}

## Commands

${commandRows(plan.commands)}
${config.extraSections !== undefined ? `\n${config.extraSections}\n` : ''}`;
  });

const writeTargetPage = (config: TargetPageConfig) =>
  Effect.gen(function* () {
    const content = yield* renderTargetPage(config);
    const targetPath = join('pages', 'targets', `${config.slug}.mdx`);

    yield* Effect.promise(() =>
      mkdir(dirname(targetPath), { recursive: true }),
    );
    yield* Effect.promise(() => writeFile(targetPath, content));
  });

const program = Effect.gen(function* () {
  for (const config of targetPageConfigs) {
    yield* writeTargetPage(config);
  }
});

Effect.runPromise(program).then(
  () => undefined,
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
