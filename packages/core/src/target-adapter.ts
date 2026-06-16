import type { Config, Effect, FileSystem, Path, PlatformError } from 'effect';
import type { CommandExecutor } from './command-executor.ts';
import type {
  AdapterError,
  CommandExecutionError,
  TargetNotFoundError,
} from './errors.ts';
import type { TargetId, Theme } from './theme-schema.ts';

export interface PlannedCreate {
  readonly path: string;
  readonly summary: string;
}

export interface PlannedCommand {
  readonly cmd: string;
  readonly why: string;
}

export interface AdapterPlan {
  readonly commands: ReadonlyArray<PlannedCommand>;
  readonly creates: ReadonlyArray<PlannedCreate>;
}

export interface TargetAdapter {
  readonly id: TargetId;
  readonly apply: (
    theme: Theme,
  ) => Effect.Effect<
    void,
    | AdapterError
    | CommandExecutionError
    | Config.ConfigError
    | PlatformError.PlatformError
    | TargetNotFoundError,
    CommandExecutor | FileSystem.FileSystem | Path.Path
  >;
  readonly plan: (theme: Theme) => AdapterPlan;
}
