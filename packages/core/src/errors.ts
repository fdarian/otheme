import { Schema } from 'effect';

export class ThemeNotFoundError extends Schema.TaggedError<ThemeNotFoundError>()(
  'ThemeNotFoundError',
  {
    available: Schema.Array(Schema.String),
    themeId: Schema.String,
  },
) {}

export class AliasNotFoundError extends Schema.TaggedError<AliasNotFoundError>()(
  'AliasNotFoundError',
  {
    alias: Schema.String,
  },
) {}

export class TargetNotFoundError extends Schema.TaggedError<TargetNotFoundError>()(
  'TargetNotFoundError',
  {
    targetId: Schema.String,
    themeId: Schema.String,
  },
) {}

export class AdapterError extends Schema.TaggedError<AdapterError>()(
  'AdapterError',
  {
    adapterId: Schema.String,
    message: Schema.String,
  },
) {}

export class CommandExecutionError extends Schema.TaggedError<CommandExecutionError>()(
  'CommandExecutionError',
  {
    command: Schema.String,
    exitCode: Schema.Number,
    stderr: Schema.optional(Schema.String),
  },
) {}

export class ConfigInvalidError extends Schema.TaggedError<ConfigInvalidError>()(
  'ConfigInvalidError',
  {
    configPath: Schema.String,
    message: Schema.String,
  },
) {}
