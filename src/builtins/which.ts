import { Command } from "commander";
import fs from "fs";
import isExe from "isexe";
import path from "path";

import { Context } from "../context";
import { ExitStatus } from "../status";

export const builtinCommandWhich = (
  context: Context,
  executable: string,
  ...args: string[]
): Promise<number> => {
  const command = new Command(executable);
  const result = command
    .usage("[-a] <filename ...>")
    .argument("<filename...>")
    .option("-a", "Print all matching pathnames of each argument")
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
  const all = command.opts().a;
  const foundExecutables: string[] = [];

  for (const executable of result.operands) {
    for (const pathComponent of context.path) {
      try {
        for (const file of fs.readdirSync(pathComponent)) {
          if (file === executable) {
            const fullPath = path.join(pathComponent, file);

            if (isExe.sync(fullPath)) {
              foundExecutables.push(fullPath);
              if (!all) {
                break;
              }
            }
          }
        }
      } catch {
        // Ignore.
      }
    }
  }

  for (const executable of foundExecutables) {
    context.stdout.write(`${executable}\n`);
  }

  return Promise.resolve(
    foundExecutables.length > 0 ? ExitStatus.OK : ExitStatus.ERROR
  );
};
