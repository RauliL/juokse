import fs from "fs";
import isExe from "isexe";
import path from "path";
import * as readline from "readline";

import { Statement } from "./ast";
import { builtinCommandMapping } from "./builtins";
import { Context } from "./context";
import { executeScript } from "./execute";
import { lex } from "./lexer";
import { parse } from "./parser";
import { ExitStatus } from "./status";

const completeVariable = (
  context: Context,
  matches: Set<string>,
  word: string,
  isComplex: boolean
) => {
  for (const mapping of [context.variables, context.environment]) {
    for (const variable of Object.keys(mapping)) {
      if (variable.startsWith(word)) {
        matches.add(isComplex ? `$\{${variable}}` : `$${variable}`);
      }
    }
  }
};

const completePath = (matches: Set<string>, word: string) => {
  const base = path.basename(word);

  if (base.length > 0) {
    const dir = path.dirname(word);

    try {
      for (const file of fs.readdirSync(dir)) {
        if (file.startsWith(base)) {
          matches.add(path.join(dir, file));
        }
      }
    } catch {
      // Ignore.
    }
  }
};

const completeCommand = (
  context: Context,
  matches: Set<string>,
  word: string
) => {
  for (const command of Object.keys(builtinCommandMapping)) {
    if (command.startsWith(word)) {
      matches.add(command);
    }
  }

  for (const pathComponent of context.path) {
    try {
      for (const file of fs.readdirSync(pathComponent)) {
        if (
          file.startsWith(word) &&
          isExe.sync(path.join(pathComponent, file))
        ) {
          matches.add(file);
        }
      }
    } catch {
      // Ignore.
    }
  }
};

export const runInteractive = (context: Context) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "juokse:1> ",
    completer(line: string): readline.CompleterResult {
      const words = line.split(/\s+/);

      if (words.length > 0) {
        const matches = new Set<string>();
        let lastWord = words[words.length - 1];
        const lastWordLength = lastWord.length;

        if (lastWord.startsWith("$")) {
          // It seems that we are completing variables.
          const isComplex = lastWord.startsWith("${");

          lastWord = lastWord.substring(isComplex ? 2 : 1);
          completeVariable(context, matches, lastWord, isComplex);
        } else {
          // It seems that we are completing commands and/or file paths.
          completePath(matches, lastWord);
          completeCommand(context, matches, lastWord);
        }

        if (matches.size > 0) {
          return [
            Array.from(matches).map(
              (match) =>
                `${line.substring(0, line.length - lastWordLength)}${match}`
            ),
            line,
          ];
        }
      }

      return [[], line];
    },
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
