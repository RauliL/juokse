import { ReturnError } from "../error";
import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Exits from an function call with optional status code.
 */
export const builtinCommandReturn = builtinCommand(0, 1, (context, n) => {
  const nn = n != null ? parseInt(n) : ExitStatus.OK;

  if (isNaN(nn)) {
    context.stderr.write(`Illegal number: ${n}\n`);

    return Promise.resolve(ExitStatus.ERROR);
  }

  return Promise.reject(new ReturnError(nn));
});
