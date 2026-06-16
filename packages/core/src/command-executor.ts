import { Context, Effect, Layer, type PlatformError, Stream } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/unstable/process';
import { CommandExecutionError } from './errors.ts';

const quoteCommandArg = (arg: string): string => {
  if (/^[A-Za-z0-9_/:=.+,-]+$/.test(arg)) {
    return arg;
  }

  return `'${arg.replaceAll("'", "'\\''")}'`;
};

export const formatCommand = (
  command: string,
  args: ReadonlyArray<string>,
): string => {
  if (args.length === 0) {
    return command;
  }

  return `${command} ${args.map(quoteCommandArg).join(' ')}`;
};

const collectText = <Error, Requirements>(
  stream: Stream.Stream<Uint8Array, Error, Requirements>,
) => stream.pipe(Stream.decodeText(), Stream.mkString);

const runCommand = (command: string, args: ReadonlyArray<string>) =>
  Effect.scoped(
    Effect.gen(function* () {
      const child = yield* ChildProcess.make(command, args, {
        stderr: 'pipe',
        stdout: 'pipe',
      });
      const result = yield* Effect.all(
        {
          exitCode: child.exitCode,
          stderr: collectText(child.stderr),
          stdout: child.stdout.pipe(Stream.runDrain),
        },
        { concurrency: 'unbounded' },
      );

      if (result.exitCode !== 0) {
        return yield* Effect.fail(
          new CommandExecutionError({
            command: formatCommand(command, args),
            exitCode: result.exitCode,
            stderr: result.stderr,
          }),
        );
      }
    }),
  );

const readCommand = (command: string, args: ReadonlyArray<string>) =>
  Effect.scoped(
    Effect.gen(function* () {
      const child = yield* ChildProcess.make(command, args, {
        stderr: 'pipe',
        stdout: 'pipe',
      });
      const result = yield* Effect.all(
        {
          exitCode: child.exitCode,
          stderr: collectText(child.stderr),
          stdout: collectText(child.stdout),
        },
        { concurrency: 'unbounded' },
      );

      if (result.exitCode !== 0) {
        return yield* Effect.fail(
          new CommandExecutionError({
            command: formatCommand(command, args),
            exitCode: result.exitCode,
            stderr: result.stderr,
          }),
        );
      }

      return result.stdout;
    }),
  );

export class CommandExecutor extends Context.Service<
  CommandExecutor,
  {
    readonly read: (
      command: string,
      args: ReadonlyArray<string>,
    ) => Effect.Effect<
      string,
      CommandExecutionError | PlatformError.PlatformError
    >;
    readonly run: (
      command: string,
      args: ReadonlyArray<string>,
    ) => Effect.Effect<
      void,
      CommandExecutionError | PlatformError.PlatformError
    >;
  }
>()('otheme/CommandExecutor', {
  make: Effect.gen(function* () {
    const childProcessSpawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    return {
      read: (command: string, args: ReadonlyArray<string>) =>
        readCommand(command, args).pipe(
          Effect.provideService(
            ChildProcessSpawner.ChildProcessSpawner,
            childProcessSpawner,
          ),
        ),
      run: (command: string, args: ReadonlyArray<string>) =>
        runCommand(command, args).pipe(
          Effect.provideService(
            ChildProcessSpawner.ChildProcessSpawner,
            childProcessSpawner,
          ),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
