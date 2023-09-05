import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Exits the script execution with optional non-zero exit status given as
 * argument.
 */
export const builtinCommandExit = builtinCommand(0, 1, (context, status) => {
  let statusCode: number;

  if (status === undefined) {
    statusCode = ExitStatus.OK;
  } else {
    try {
      statusCode = parseInt(status);
    } catch (err) {
      context.stderr.write(`Argument '${status}' must be an integer\n`);

      return Promise.resolve(ExitStatus.ERROR);
    }
  }
  context.emit("exit", statusCode);

  return Promise.resolve(ExitStatus.OK);
});
