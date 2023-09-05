import { Command } from "commander";
import { sprintf } from "sprintf-js";

import { Context } from "../context";
import { ExitStatus } from "../status";

export const builtinCommandPrintf = async (
  context: Context,
  executable: string,
  ...args: string[]
): Promise<number> => {
  const command = new Command(executable);
  const result = command
    .usage("<format> [argument ...]")
    .argument("<format>")
    .argument("[argument...]")
    .configureOutput({
      writeOut(str) {
        context.stdout.write(str);
      },
      writeErr(str) {
        context.stderr.write(str);
      },
    })
    .exitOverride(() => {
      context.emit("exit", ExitStatus.ERROR);
    })
    .parseOptions(args);

  context.stdout.write(
    sprintf(result.operands[0], ...result.operands.slice(1))
  );

  return ExitStatus.OK;
};
