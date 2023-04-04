import fs from "fs";

import { compile } from "./compiler";
import { Context } from "./context";
import { BreakError, ContinueError } from "./error";
import { executeScript } from "./execute";
import { ExitStatus } from "./status";

export type BuiltinCommandCallback = (
  context: Context,
  executable: string,
  ...args: string[]
) => Promise<number>;

const builtinCommand =
  (
    minArgCount: number,
    maxArgCount: number | undefined,
    callback: (context: Context, ...args: string[]) => Promise<number>
  ): BuiltinCommandCallback =>
  (
    context: Context,
    executable: string,
    ...args: string[]
  ): Promise<number> => {
    if (args.length < minArgCount) {
      context.stderr.write(`${executable}: Too few arguments\n`);

      return Promise.resolve(ExitStatus.INVALID_ARGS);
    } else if (maxArgCount != null && args.length > maxArgCount) {
      context.stderr.write(`${executable}: Too many arguments\n`);

      return Promise.resolve(ExitStatus.INVALID_ARGS);
    }

    return callback(context, ...args);
  };

/**
 * Executes command given as argument and negates it's exit status.
 */
const builtinCommandNot = builtinCommand(
  1,
  undefined,
  (context, executable, ...args) =>
    context
      .execute(executable, ...args)
      .then(({ status }) =>
        status === ExitStatus.OK ? ExitStatus.ERROR : ExitStatus.OK
      )
);

/**
 * Exits from the enclosing `for` or `while` loops, if any.
 */
const builtinCommandBreak = builtinCommand(0, 1, (context, n) => {
  const nn = n != null ? parseInt(n) : 1;

  if (isNaN(nn)) {
    context.stderr.write(`Illegal number: ${n}`);

    return Promise.resolve(ExitStatus.ERROR);
  }

  return Promise.reject(new BreakError(nn));
});

/**
 * Changes the current directory to the specified directory.
 */
const builtinCommandCd = builtinCommand(0, 1, (context, directory) => {
  if (!directory) {
    const home = context.home;

    if (!home) {
      context.stderr.write("Unable to determine home directory\n");

      return Promise.resolve(ExitStatus.ERROR);
    }
    directory = home;
  }

  try {
    context.cwd = directory;
  } catch (err) {
    context.stderr.write(`Directory '${directory}' does not exist\n`);

    return Promise.resolve(ExitStatus.ERROR);
  }

  return Promise.resolve(ExitStatus.OK);
});

/**
 * Resumes the next iteration of the enclosing `for` or `while` loops.
 */
const builtinCommandContinue = builtinCommand(0, 1, (context, n) => {
  const nn = n != null ? parseInt(n) : 1;

  if (isNaN(nn)) {
    context.stderr.write(`Illegal number: ${n}`);

    return Promise.resolve(ExitStatus.ERROR);
  }

  return Promise.reject(new ContinueError(nn));
});

/**
 * Exits the script execution with optional non-zero exit status given as
 * argument.
 */
const builtinCommandExit = builtinCommand(0, 1, (context, status) => {
  let statusCode: number;

  if (status === undefined) {
    statusCode = ExitStatus.OK;
  } else {
    try {
      statusCode = parseInt(status);
    } catch (err) {
      process.stderr.write(`Argument '${status}' must be an integer\n`);

      return Promise.resolve(ExitStatus.ERROR);
    }
  }
  context.emit("exit", statusCode);

  return Promise.resolve(ExitStatus.OK);
});

/**
 * Displays the current directory.
 */
const builtinCommandPwd = builtinCommand(0, 0, (context) => {
  context.stdout.write(context.cwd);

  return Promise.resolve(ExitStatus.OK);
});

/**
 * Executes another script.
 */
const builtinCommandSource = builtinCommand(1, 1, async (context, filename) =>
  executeScript(
    context,
    await compile(filename, fs.readFileSync(filename, "utf-8"))
  ).then(() => ExitStatus.OK)
);

/**
 * Deletes an variable from the context.
 */
const builtinCommandUnset = builtinCommand(
  1,
  undefined,
  (context, ...names) => {
    for (const name of names) {
      delete context.variables[name];
    }

    return Promise.resolve(ExitStatus.OK);
  }
);

export const builtinCommandMapping: Record<string, BuiltinCommandCallback> = {
  "!": builtinCommandNot,
  ".": builtinCommandSource,
  break: builtinCommandBreak,
  cd: builtinCommandCd,
  continue: builtinCommandContinue,
  exit: builtinCommandExit,
  false: builtinCommand(0, 0, () => Promise.resolve(ExitStatus.ERROR)),
  pwd: builtinCommandPwd,
  source: builtinCommandSource,
  true: builtinCommand(0, 0, () => Promise.resolve(ExitStatus.OK)),
  unset: builtinCommandUnset,
};
