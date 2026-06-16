import { Config, Effect, FileSystem, Path } from 'effect';
import { CommandExecutor, formatCommand } from '../command-executor.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  getTmuxTarget,
  missingTargetPlan,
  requireTmuxTarget,
} from './target-selectors.ts';
import { renderTmux, tmuxTemplate } from './tmux-renderer.ts';

const tmuxThemePathFor = (theme: Theme): string =>
  `~/.config/tmux/themes/${theme.id}.conf`;

const tmuxConfigPath = '~/.config/tmux/tmux.conf';

const tmuxSourceLineFor = (theme: Theme): string =>
  `source-file $HOME/.config/tmux/themes/${theme.id}.conf`;

const updateTmuxConfig = (content: string, theme: Theme): string => {
  const nextSourceLine = tmuxSourceLineFor(theme);
  const sourceLinePattern =
    /^source-file \$HOME\/\.config\/tmux\/themes\/\S+\.conf$/m;

  if (sourceLinePattern.test(content)) {
    return content.replace(sourceLinePattern, nextSourceLine);
  }

  const separator = content.endsWith('\n') ? '' : '\n';

  return `${content}${separator}${nextSourceLine}\n`;
};

export const tmuxAdapter: TargetAdapter = {
  id: 'tmux',
  plan: (theme: Theme) => {
    const target = getTmuxTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'tmux');
    }

    return {
      commands: [
        {
          cmd: formatCommand('tmux', ['source-file', tmuxConfigPath]),
          why: 'reload tmux so the active theme changes immediately',
        },
      ],
      creates: [
        {
          path: tmuxThemePathFor(theme),
          summary: `write generated tmux theme for ${theme.name}`,
        },
        {
          path: tmuxConfigPath,
          summary: `ensure active tmux source-file line points to ${tmuxThemePathFor(
            theme,
          )}`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requireTmuxTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const executor = yield* CommandExecutor;
      const home = yield* Config.string('HOME');
      const themePath = path.join(
        home,
        '.config',
        'tmux',
        'themes',
        `${theme.id}.conf`,
      );
      const configPath = path.join(home, '.config', 'tmux', 'tmux.conf');
      const rendered = yield* renderTmux(tmuxTemplate, theme, target);
      const configContent = yield* fs.readFileString(configPath);

      yield* fs.makeDirectory(path.dirname(themePath), { recursive: true });
      yield* fs.writeFileString(themePath, rendered);
      yield* fs.writeFileString(
        configPath,
        updateTmuxConfig(configContent, theme),
      );
      yield* executor.run('tmux', ['source-file', configPath]);
    }),
};
