import backslash from "backslash";
import { Command } from "commander";

import { Context } from "../context";
import { ExitStatus } from "../status";

export const builtinCommandEcho = async (
  context: Context,
  executable: string,
  ...args: string[]
): Promise<number> => {
  const command = new Command(executable);
  let outputNewline = true;
  let separator = " ";
  let expandBackslashes = false;

  const result = command
    .usage("[options] [string ...]")
    .argument("[string...]")
    .option("-n", "Do not output a newline")
    .option("-s", "Do not separate arguments with spaces")
    .option("-E", "Disable interpretation of backslash escapes (default)")
    .option("-e", "Enable interpretation of backslash escapes")
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

  const options = command.opts();

  if (options.n) {
    outputNewline = false;
  }

  if (options.s) {
    separator = "";
  }

  if (options.E) {
    expandBackslashes = false;
  }

  if (options.e) {
    expandBackslashes = true;
  }

  context.stdout.write(
    result.operands
      .map((arg) => (expandBackslashes ? backslash(arg) : arg))
      .join(separator)
  );
  if (outputNewline) {
    context.stdout.write("\n");
  }

  return ExitStatus.OK;
};
