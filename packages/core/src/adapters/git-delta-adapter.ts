import { Config, Effect, FileSystem, Path } from 'effect';
import { formatCommand } from '../command-executor.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  addOthemeInclude,
  gitDeltaConfRelPath,
  gitDeltaIncludePath,
  hasOthemeInclude,
  renderGitDeltaConf,
} from './git-delta-renderer.ts';
import {
  getGitDeltaTarget,
  missingTargetPlan,
  requireGitDeltaTarget,
} from './target-selectors.ts';

const gitconfigRelPath = '.gitconfig';

export const gitDeltaAdapter: TargetAdapter = {
  id: 'git-delta',
  plan: (theme: Theme) => {
    const target = getGitDeltaTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'git-delta');
    }

    return {
      commands: [
        {
          cmd: formatCommand('git', ['config', '--global', '--list']),
          why: 'check whether the otheme delta include is already present in ~/.gitconfig',
        },
      ],
      creates: [
        {
          path: `~/${gitDeltaConfRelPath}`,
          summary: `write [delta] config with features=${target.features} and palette-derived diff colors`,
        },
        {
          path: `~/${gitconfigRelPath}`,
          summary: `add [include] path = ${gitDeltaIncludePath} if not already present`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      const target = yield* requireGitDeltaTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');

      const confPath = path.join(home, gitDeltaConfRelPath);
      const gitconfigPath = path.join(home, gitconfigRelPath);

      yield* fs.makeDirectory(path.dirname(confPath), { recursive: true });
      yield* fs.writeFileString(confPath, renderGitDeltaConf(theme, target));

      const gitconfigExists = yield* fs.exists(gitconfigPath);
      const gitconfigContent = gitconfigExists
        ? yield* fs.readFileString(gitconfigPath)
        : '';

      if (!hasOthemeInclude(gitconfigContent)) {
        yield* fs.writeFileString(
          gitconfigPath,
          addOthemeInclude(gitconfigContent),
        );
      }
    }),
};
