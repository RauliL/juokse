import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Displays the current directory.
 */
export const builtinCommandPwd = builtinCommand(0, 0, (context) => {
  context.stdout.write(context.cwd);

  return Promise.resolve(ExitStatus.OK);
});
