import { Context } from "../context";
import { ExitStatus } from "../status";
import { BuiltinCommandCallback } from "./types";

export const builtinCommand =
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
