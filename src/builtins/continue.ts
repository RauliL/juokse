import { ContinueError } from "../error";
import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Resumes the next iteration of the enclosing `for` or `while` loops.
 */
export const builtinCommandContinue = builtinCommand(0, 1, (context, n) => {
  const nn = n != null ? parseInt(n) : 1;

  if (isNaN(nn)) {
    context.stderr.write(`Illegal number: ${n}\n`);

    return Promise.resolve(ExitStatus.ERROR);
  }

  return Promise.reject(new ContinueError(nn));
});
