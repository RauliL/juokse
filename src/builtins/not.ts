import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Executes command given as argument and negates it's exit status.
 */
export const builtinCommandNot = builtinCommand(
  1,
  undefined,
  (context, executable, ...args) =>
    context
      .execute(executable, ...args)
      .then(({ status }) =>
        status === ExitStatus.OK ? ExitStatus.ERROR : ExitStatus.OK
      )
);
