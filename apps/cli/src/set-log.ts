import { Console, Effect, Fiber, Result, Schedule } from 'effect';
import pc from 'picocolors';

export type SetLogResultOptions = {
  readonly dryRun: boolean;
  readonly elapsedMs: number | undefined;
  readonly errorCount: number;
};

type SetOperationFailure<Error> = {
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

const clearSpinnerLine = '\r\x1b[2K';

const renderFailureLines = (
  label: string,
  detail: string | undefined,
): ReadonlyArray<string> => [
  renderFailureLine(label),
  ...stderrExcerptLines(detail).map((line) => `      ${pc.dim(line)}`),
];

/** Buffers one target's lines so concurrent targets print as whole blocks instead of interleaving */
export type SetTargetLog = {
  readonly lines: Array<string>;
};

export const makeSetTargetLog = (): SetTargetLog => ({ lines: [] });

export const recordSetTargetFailure = (
  log: SetTargetLog,
  reason: string,
  detail: string | undefined,
) =>
  Effect.sync(() => {
    log.lines.push(...renderFailureLines(reason, detail));
  });

export const recordSetOperation = <Value, Error, Requirements>(
  log: SetTargetLog,
  successLine: string,
  effect: Effect.Effect<Value, Error, Requirements>,
  failure: SetOperationFailure<Error>,
): Effect.Effect<Value, Error, Requirements> =>
  Effect.gen(function* () {
    const result = yield* Effect.result(effect);

    if (Result.isFailure(result)) {
      log.lines.push(
        ...renderFailureLines(
          failure.label(result.failure),
          failure.detail(result.failure),
        ),
      );
      return yield* Effect.fail(result.failure);
    }

    log.lines.push(successLine);

    return result.success;
  });

const renderTargetBlock = (targetId: string, log: SetTargetLog): string =>
  ['', renderTargetLine(targetId), ...log.lines]
    .map((line) => `${line}\n`)
    .join('');

const spinnerLoop = (pendingTargetIds: ReadonlySet<string>) => {
  let frameIndex = 0;

  return Effect.sync(() => {
    const frame = spinnerFrames[frameIndex];

    if (frame === undefined || pendingTargetIds.size === 0) {
      return;
    }

    frameIndex = (frameIndex + 1) % spinnerFrames.length;
    process.stdout.write(
      renderPendingLine(frame, Array.from(pendingTargetIds).join(', ')),
    );
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

/** Shows one spinner naming the still-running targets; `complete` prints a finished target's block above it */
export const withSetProgress = <Value, Error, Requirements>(
  targetIds: ReadonlyArray<string>,
  use: (
    complete: (targetId: string, log: SetTargetLog) => Effect.Effect<void>,
  ) => Effect.Effect<Value, Error, Requirements>,
): Effect.Effect<Value, Error, Requirements> => {
  const pendingTargetIds = new Set(targetIds);
  const complete = (targetId: string, log: SetTargetLog) =>
    Effect.sync(() => {
      pendingTargetIds.delete(targetId);
      process.stdout.write(
        `${interactiveOutput ? clearSpinnerLine : ''}${renderTargetBlock(targetId, log)}`,
      );
    });

  if (!interactiveOutput) {
    return use(complete);
  }

  return Effect.acquireUseRelease(
    spinnerLoop(pendingTargetIds).pipe(Effect.forkChild),
    () => use(complete),
    (spinnerFiber) =>
      Fiber.interrupt(spinnerFiber).pipe(
        Effect.andThen(writeStdout(clearSpinnerLine)),
      ),
  );
};

export const printSetResult = (
  themeId: string,
  targetCount: number,
  options: SetLogResultOptions,
) =>
  Effect.gen(function* () {
    yield* Console.log('');
    yield* Console.log(renderResultLine(themeId, targetCount, options));
  });
