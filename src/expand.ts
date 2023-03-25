import { globSync, hasMagic } from "glob";

import { visitWord, Word, WordVisitor } from "./ast";
import { Context } from "./context";
import { JuokseError } from "./error";

const VARIABLE_PATTERN = /\$(\{[^}]+\}|\S+)/g;

// TODO: Add support for tilde expansion.

const expandVariables = (context: Context, input: string): string =>
  input.replace(VARIABLE_PATTERN, (match: string, name: string) => {
    if (/^\{.+}$/.test(name)) {
      name = name.substring(1, name.length - 1);
    }

    return context.variables[name] ?? context.environment[name] ?? "";
  });

const expandVisitor: WordVisitor<Promise<string[]>, Context> = {
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
