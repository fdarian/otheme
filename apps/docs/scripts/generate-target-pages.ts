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
  /** Optional markdown sections rendered between generatedNotice and ## Compatibility. */
  readonly setupSection?: string;
  readonly slug: string;
  /** Optional markdown sections rendered between ## Files and ## Commands. */
  readonly midSections?: string;
  readonly title: string;
};

const representativeThemeId = 'vesper';
const generatedNotice =
  'This page is generated from the adapter plan used by `otheme set vesper --dry-run`. Paths are shown exactly as otheme prints them; `~` means your home directory.';

const targetPageConfigs = [
  {
    compatibility:
      'Requires `init.lua`. If otheme finds `~/.config/nvim/init.vim` but no `init.lua`, it will print an error and tell you either to migrate to `init.lua` or to add the block manually.',
    id: 'nvim',
    intro:
      'The nvim target generates a Lua colorscheme file and auto-manages the `~/.config/nvim/init.lua` block that sources it. New Neovim instances pick up the theme immediately; already-running instances are live-updated via their socket.',
    midSections: `## init.lua block

otheme appends (or replaces) the following block in your \`init.lua\`. The markers let otheme locate and replace the block on subsequent runs — do not edit the lines inside it:

\`\`\`lua
-- >>> otheme: auto-generated — do NOT edit this block. otheme locates and >>>
-- >>> replaces it by matching these markers; manual edits are overwritten. >>>
pcall(dofile, vim.fn.expand("~/.config/otheme/generated/nvim.lua"))
-- <<< otheme <<<
\`\`\`

The block is appended at end-of-file on first run so it executes after your plugin/colorscheme setup (last-colorscheme-wins, avoiding lazy.nvim load-order issues).`,
    setupSection: `## Setup

Enable the nvim target in your config and run \`otheme set <theme>\` — that's it. otheme writes the generated colorscheme and patches your \`init.lua\` automatically. No manual colorscheme line is needed.`,
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
      'Author and map modes. In author mode, otheme writes `~/.claude/themes/<theme-id>.json` and sets `theme = custom:<theme-id>`. In map mode, it sets `theme` to the built-in `light` or `dark` preset.',
    id: 'claude-code',
    intro:
      'The claude-code target writes a generated Claude Code theme JSON when needed and updates Claude Code settings while preserving other settings.',
    midSections: `## Running inside tmux

When \`$TMUX\` is set, Claude Code caps its output to 256 colors, so your authored theme renders with washed-out, approximated colors instead of the exact palette. Set \`CLAUDE_CODE_TMUX_TRUECOLOR=1\` to opt back into truecolor inside tmux:

\`\`\`sh
export CLAUDE_CODE_TMUX_TRUECOLOR=1
\`\`\`

See [this issue comment](https://github.com/anthropics/claude-code/issues/36785#issuecomment-4169173830) for details.`,
    slug: 'claude-code',
    title: 'claude-code',
  },
  {
    compatibility:
      'Author mode. otheme writes a dedicated git include file with a `[delta]` section, deriving diff colors from the shared palette, setting the `features` field to a named delta theme, and pointing `syntax-theme` at the otheme-derived bat theme.',
    id: 'git-delta',
    intro:
      'The git-delta target writes ~/.config/git/otheme-delta.conf with palette-derived diff colors and ensures ~/.gitconfig includes it.',
    midSections: `## Enable bat alongside git-delta

git-delta has no syntax engine of its own — it delegates syntax highlighting to [bat](/targets/bat). The generated \`[delta]\` config sets \`syntax-theme = otheme-<theme-id>\`, which is the bat theme the [bat target](/targets/bat) authors from the same palette.

For diff token colors to match your theme, **enable both targets**:

\`\`\`json
{
  "targets": {
    "git-delta": true,
    "bat": true
  }
}
\`\`\`

If git-delta is enabled but bat is not, the referenced \`otheme-<theme-id>\` syntax theme won't exist and delta falls back to its default highlighting (diff chrome colors still match, but the code tokens inside diffs won't).`,
    slug: 'git-delta',
    title: 'git-delta',
  },
  {
    compatibility:
      "Author mode. otheme writes a TextMate `.tmTheme` derived from the shared palette into bat's themes directory, points bat's config at it via `--theme`, and rebuilds the bat theme cache.",
    id: 'bat',
    intro:
      'The bat target authors a syntax theme (`otheme-<theme-id>.tmTheme`) from the shared palette, installs it into bat, and makes it the active bat theme. This is also the theme [git-delta](/targets/git-delta) references for diff syntax highlighting.',
    midSections: `## Why bat and git-delta go together

[git-delta](/targets/git-delta) delegates syntax highlighting to bat. The bat target is what authors the \`otheme-<theme-id>\` syntax theme that git-delta references via \`syntax-theme\`. **If you enable git-delta, enable bat too** so the referenced theme exists:

\`\`\`json
{
  "targets": {
    "bat": true,
    "git-delta": true
  }
}
\`\`\``,
    slug: 'bat',
    title: 'bat',
  },
  {
    compatibility: 'otheme owns `~/.config/yazi/theme.toml`.',
    id: 'yazi',
    intro:
      'The yazi target writes a palette-derived `theme.toml` for yazi and leaves the rest of your yazi config alone.',
    slug: 'yazi',
    title: 'yazi',
  },
  {
    compatibility:
      'Author mode. otheme writes a managed region at the top of `~/.config/hunk/config.toml`, setting `theme = "custom"` and rendering `[custom_theme]` plus `[custom_theme.syntax]` while preserving your other keys, tables, and comments.',
    id: 'hunk',
    intro:
      'The hunk target renders a palette-derived custom theme TOML and surgically replaces only the otheme-managed region.',
    setupSection: `## Setup

Enable the hunk target in your config and run \`otheme set <theme>\`. otheme creates \`~/.config/hunk/config.toml\` if it does not exist, or updates only the managed custom-theme block if it does.`,
    slug: 'hunk',
    title: 'hunk',
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
${config.setupSection !== undefined ? `\n${config.setupSection}\n` : ''}
## Compatibility

${config.compatibility}

## Files

${fileRows(plan.creates)}
${config.midSections !== undefined ? `\n${config.midSections}\n` : ''}
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
