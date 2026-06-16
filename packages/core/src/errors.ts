import { Schema } from 'effect';

export class ThemeNotFoundError extends Schema.TaggedErrorClass<ThemeNotFoundError>()(
  'ThemeNotFoundError',
  {
    available: Schema.Array(Schema.String),
    themeId: Schema.String,
  },
) {}

export class AliasNotFoundError extends Schema.TaggedErrorClass<AliasNotFoundError>()(
  'AliasNotFoundError',
  {
    alias: Schema.String,
  },
) {}

export class TargetNotFoundError extends Schema.TaggedErrorClass<TargetNotFoundError>()(
  'TargetNotFoundError',
  {
    targetId: Schema.String,
    themeId: Schema.String,
  },
) {}

export class AdapterError extends Schema.TaggedErrorClass<AdapterError>()(
  'AdapterError',
  {
    adapterId: Schema.String,
    message: Schema.String,
  },
) {}

export class CommandExecutionError extends Schema.TaggedErrorClass<CommandExecutionError>()(
  'CommandExecutionError',
  {
    command: Schema.String,
    exitCode: Schema.Number,
    stderr: Schema.optional(Schema.String),
  },
) {}
