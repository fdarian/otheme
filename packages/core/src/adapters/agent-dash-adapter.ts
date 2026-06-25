import { Config, Effect, FileSystem, Path, Schema } from 'effect';
import { AdapterError } from '../errors.ts';
import type { TargetAdapter } from '../target-adapter.ts';
import type { Theme } from '../theme-schema.ts';
import {
  getAgentDashTarget,
  missingTargetPlan,
  requireAgentDashTarget,
} from './target-selectors.ts';

const configRelPath = '.config/agent-dash/config.json';
const ConfigJson = Schema.fromJsonString(
  Schema.Record(Schema.String, Schema.Unknown),
);
const decodeConfigJson = Schema.decodeUnknownEffect(ConfigJson);

const readConfig = (content: string) =>
  decodeConfigJson(content).pipe(
    Effect.mapError(
      (error) =>
        new AdapterError({
          adapterId: 'agent-dash',
          message: `Could not parse agent-dash config JSON: ${String(error)}`,
        }),
    ),
  );

const detectJsonIndent = (content: string): string | number => {
  const match = content.match(/\n([ \t]+)"/);

  if (match !== null && match[1] !== undefined) {
    return match[1];
  }

  return 2;
};

const updateConfig = (content: string, appearance: Theme['appearance']) =>
  Effect.gen(function* () {
    if (content.length === 0) {
      return `${JSON.stringify({ theme: appearance }, null, 2)}\n`;
    }

    const config = yield* readConfig(content);
    const next: Record<string, unknown> = Object.assign({}, config);
    next.theme = appearance;

    const trailingNewline = content.endsWith('\n') ? '\n' : '';
    return `${JSON.stringify(next, null, detectJsonIndent(content))}${trailingNewline}`;
  });

export const agentDashAdapter: TargetAdapter = {
  id: 'agent-dash',
  plan: (theme: Theme) => {
    const target = getAgentDashTarget(theme);

    if (target === undefined) {
      return missingTargetPlan(theme, 'agent-dash');
    }

    return {
      commands: [],
      creates: [
        {
          path: `~/${configRelPath}`,
          summary: `set JSON key theme = ${theme.appearance}`,
        },
      ],
    };
  },
  apply: (theme: Theme) =>
    Effect.gen(function* () {
      yield* requireAgentDashTarget(theme);
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const home = yield* Config.string('HOME');

      const configPath = path.join(home, configRelPath);
      const exists = yield* fs.exists(configPath);
      const content = exists ? yield* fs.readFileString(configPath) : '';
      const nextContent = yield* updateConfig(content, theme.appearance);

      yield* fs.makeDirectory(path.dirname(configPath), { recursive: true });
      yield* fs.writeFileString(configPath, nextContent);
    }),
};
