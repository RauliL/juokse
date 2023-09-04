import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Deletes an variable from the context.
 */
export const builtinCommandUnset = builtinCommand(
  1,
  undefined,
  (context, ...names) => {
    for (const name of names) {
      delete context.variables[name];
    }

    return Promise.resolve(ExitStatus.OK);
  }
);
