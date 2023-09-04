import * as readline from "readline";

import { Statement } from "./ast";
import { Context } from "./context";
import { executeScript } from "./execute";
import { lex } from "./lexer";
import { parse } from "./parser";
import { ExitStatus } from "./status";

export const runInteractive = (context: Context) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "juokse:1> ",
  });
  let lineNumber = 1;

  rl.on("line", (source) => {
    let script: Statement[];

    try {
      script = parse(lex("<stdin>", lineNumber++, source));
    } catch (err) {
      console.error(err);
      return;
    }

    executeScript(context, script)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        rl.setPrompt(`juokse:${lineNumber}> `);
        rl.prompt();
      });
  });

  rl.on("close", () => {
    process.exit(ExitStatus.OK);
  });

  rl.prompt();
};
