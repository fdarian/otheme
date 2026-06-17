import { Console, Effect, Fiber, Result, Schedule } from 'effect';
import pc from 'picocolors';

export type SetLogResultOptions = {
  readonly dryRun: boolean;
  readonly elapsedMs: number | undefined;
  readonly errorCount: number;
};

type SetSpinnerFailure<Error> = {
  readonly detail: (error: Error) => string | undefined;
  readonly label: (error: Error) => string;
};

const defaultTerminalColumns = 80;
const pendingPrefixColumns = 7;
const pendingSlackColumns = 1;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const interactiveOutput = process.stdout.isTTY === true;

const formatTargetCount = (count: number): string =>
  `${count} target${count === 1 ? '' : 's'}`;

const formatErrorCount = (count: number): string =>
  `${count} error${count === 1 ? '' : 's'}`;

export const collapseHomePath = (
  path: string,
  homePath: string | undefined,
): string => {
  if (path === '~') {
    return path;
  }

  if (homePath === undefined) {
    return path;
  }

  if (path === homePath) {
    return '~';
  }

  if (path.startsWith(`${homePath}/`)) {
    return `~${path.slice(homePath.length)}`;
  }

  return path;
};

const renderInvocationLine = (themeId: string, dryRun: boolean): string => {
  const commandText = dryRun ? 'otheme set --dry-run ' : 'otheme set ';

  return `${pc.dim(commandText)}${pc.bold(pc.cyan(themeId))}`;
};

const renderHeaderLine = (themeId: string, targetCount: number): string =>
  `  ${pc.bold(pc.cyan(themeId))}  ${pc.dim(`→ ${formatTargetCount(targetCount)} enabled`)}`;

const renderTargetLine = (targetId: string): string => `  ${pc.bold(targetId)}`;

const pendingLabelMaxColumns = (): number =>
  Math.max(
    0,
    (process.stdout.columns ?? defaultTerminalColumns) -
      pendingPrefixColumns -
      pendingSlackColumns,
  );

const truncatePendingLabel = (label: string): string => {
  const maxColumns = pendingLabelMaxColumns();
  const labelChars = Array.from(label);

  if (labelChars.length <= maxColumns) {
    return label;
  }

  if (maxColumns <= 0) {
    return '';
  }

  if (maxColumns === 1) {
    return '…';
  }

  return `${labelChars.slice(0, maxColumns - 1).join('')}…`;
};

const renderPendingLine = (frame: string, label: string): string =>
  `\r\x1b[2K    ${pc.dim(pc.yellow(frame))}  ${pc.dim(truncatePendingLabel(label))}`;

const renderFailureLine = (label: string): string =>
  `    ${pc.red('✗')}  ${label}`;

export const renderSetCreateLine = (
  path: string,
  homePath: string | undefined,
): string => `    ${pc.green('+')}  ${collapseHomePath(path, homePath)}`;

export const renderSetCommandLine = (command: string): string =>
  `    ${pc.yellow('$')}  ${pc.dim(command)}`;

const renderResultLine = (
  themeId: string,
  targetCount: number,
  options: SetLogResultOptions,
): string => {
  if (options.dryRun) {
    if (options.errorCount > 0) {
      return `  ${pc.yellow(`⚠ would apply ${themeId} with ${formatErrorCount(options.errorCount)}`)}${pc.dim(` · ${formatTargetCount(targetCount)}`)}`;
    }

    return `  ${pc.green(`✓ would apply ${themeId}`)}${pc.dim(` · ${formatTargetCount(targetCount)}`)}`;
  }

  const detail =
    options.elapsedMs === undefined
      ? ` · ${formatTargetCount(targetCount)}`
      : ` · ${formatTargetCount(targetCount)} · ${options.elapsedMs}ms`;

  if (options.errorCount > 0) {
    return `  ${pc.yellow(`⚠ applied ${themeId} with ${formatErrorCount(options.errorCount)}`)}${pc.dim(detail)}`;
  }

  return `  ${pc.green(`✓ applied ${themeId}`)}${pc.dim(detail)}`;
};

const stderrExcerptLines = (
  stderr: string | undefined,
): ReadonlyArray<string> => {
  if (stderr === undefined) {
    return [];
  }

  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length <= 4) {
    return lines;
  }

  return [...lines.slice(0, 4), '...'];
};

const writeStdout = (text: string) =>
  Effect.sync(() => {
    process.stdout.write(text);
  });

const writeStdoutLine = (text: string) => writeStdout(`${text}\n`);

const clearSpinnerLine = writeStdout('\r\x1b[2K');

const printSetFailure = (label: string, detail: string | undefined) =>
  Effect.gen(function* () {
    yield* writeStdoutLine(renderFailureLine(label));

    for (const line of stderrExcerptLines(detail)) {
      yield* writeStdoutLine(`      ${pc.dim(line)}`);
    }
  });

export const printSetTargetFailure = (
  reason: string,
  detail: string | undefined,
) => printSetFailure(reason, detail);

const spinnerLoop = (pendingLabel: string) => {
  let frameIndex = 0;

  return Effect.sync(() => {
    const frame = spinnerFrames[frameIndex];

    if (frame === undefined) {
      return;
    }

    frameIndex = (frameIndex + 1) % spinnerFrames.length;
    process.stdout.write(renderPendingLine(frame, pendingLabel));
  }).pipe(Effect.repeat(Schedule.spaced(80)));
};

export const printSetApplyStart = (
  themeId: string,
  targetCount: number,
  dryRun: boolean,
) =>
  Effect.gen(function* () {
    yield* Console.log(renderInvocationLine(themeId, dryRun));
    yield* Console.log('');
    yield* Console.log(renderHeaderLine(themeId, targetCount));
  });

export const printSetTargetStart = (targetId: string) =>
  Effect.gen(function* () {
    yield* Console.log('');
    yield* Console.log(renderTargetLine(targetId));
  });

export const runSetSpinner = <Value, Error, Requirements>(
  pendingLabel: string,
  successLine: string,
  effect: Effect.Effect<Value, Error, Requirements>,
  failure: SetSpinnerFailure<Error>,
): Effect.Effect<Value, Error, Requirements> =>
  Effect.gen(function* () {
    const result = interactiveOutput
      ? yield* Effect.acquireUseRelease(
          spinnerLoop(pendingLabel).pipe(Effect.forkChild),
          () => Effect.result(effect),
          (spinnerFiber) =>
            Fiber.interrupt(spinnerFiber).pipe(
              Effect.andThen(clearSpinnerLine),
            ),
        )
      : yield* Effect.result(effect);

    if (Result.isFailure(result)) {
      yield* printSetFailure(
        failure.label(result.failure),
        failure.detail(result.failure),
      );
      return yield* Effect.fail(result.failure);
    }

    yield* writeStdoutLine(successLine);

    return result.success;
  });

export const printSetResult = (
  themeId: string,
  targetCount: number,
  options: SetLogResultOptions,
) =>
  Effect.gen(function* () {
    yield* Console.log('');
    yield* Console.log(renderResultLine(themeId, targetCount, options));
  });
