import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Changes the current directory to the specified directory.
 */
export const builtinCommandCd = builtinCommand(0, 1, (context, directory) => {
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
