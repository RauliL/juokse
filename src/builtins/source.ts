import fs from "fs";

import { compile } from "../compiler";
import { executeScript } from "../execute";
import { ExitStatus } from "../status";
import { builtinCommand } from "./utils";

/**
 * Executes another script.
 */
export const builtinCommandSource = builtinCommand(
  1,
  1,
  async (context, filename) =>
    executeScript(
      context,
      await compile(filename, fs.readFileSync(filename, "utf-8"))
    ).then(() => ExitStatus.OK)
);
