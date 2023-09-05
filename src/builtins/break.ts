import { BreakError } from "../error";
import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Exits from the enclosing `for` or `while` loops, if any.
 */
export const builtinCommandBreak = builtinCommand(0, 1, (context, n) => {
  const nn = n != null ? parseInt(n) : 1;

  if (isNaN(nn)) {
    context.stderr.write(`Illegal number: ${n}\n`);

    return Promise.resolve(ExitStatus.ERROR);
  }

  return Promise.reject(new BreakError(nn));
});
