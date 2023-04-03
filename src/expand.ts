import { globSync, hasMagic } from "glob";
import { trimEnd } from "lodash";
import { PassThrough } from "stream";

import { visitWord, Word, WordVisitor } from "./ast";
import { compile } from "./compiler";
import { Context } from "./context";
import { JuokseError } from "./error";
import { executeScript } from "./execute";

const VARIABLE_PATTERN = /\$(\{[^}]+\}|[^\s/]+)/g;

// TODO: Add support for tilde expansion.

const expandVariables = (context: Context, input: string): string =>
  input.replace(VARIABLE_PATTERN, (match: string, name: string) => {
    if (/^\{.+}$/.test(name)) {
      name = name.substring(1, name.length - 1);
    }

    return context.variables[name] ?? context.environment[name] ?? "";
  });

const expandVisitor: WordVisitor<Promise<string[]>, Context> = {
  async visitBacktick(word: Word, context: Context): Promise<string[]> {
    const script = await compile(word.position.filename, word.text);
    const oldStdout = context.stdout;
    const newStdout = new PassThrough();
    let buffer = "";

    context.stdout = newStdout;
    context.stdout.on("data", (chunk) => {
      buffer += chunk.toString("utf-8");
    });
    try {
      await executeScript(context, script);
    } finally {
      context.stdout = oldStdout;
    }

    return [trimEnd(buffer)];
  },

  async visitDoubleQuote(word: Word, context: Context): Promise<string[]> {
    return [expandVariables(context, word.text)];
  },

  async visitSingleQuote(word: Word): Promise<string[]> {
    return [word.text];
  },

  async visitWord(word: Word, context: Context): Promise<string[]> {
    const text = expandVariables(context, word.text);

    if (hasMagic(text)) {
      const results = globSync(text, { cwd: context.cwd });

      if (!results.length) {
        throw new JuokseError(
          `No matches for wildcard '${text}'.`,
          word.position
        );
      }

      return results;
    }

    return [text];
  },
};

export const expandWord = (context: Context, word: Word): Promise<string[]> =>
  visitWord(expandVisitor, word, context);
