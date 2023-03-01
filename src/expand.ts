import { globSync, hasMagic } from "glob";

import { visitWord, Word, WordVisitor } from "./ast";
import { Context } from "./context";
import { JuokseError } from "./error";

// TODO: Add support for tilde expansion.

const expandVariables = (context: Context, input: string): string => {
  const pattern = /\$(\{[^}]+\}|\S+)/gm;
  let array: RegExpExecArray | null;

  while ((array = pattern.exec(input)) != null) {
    let name = array[1];

    if (/^\{.+\}$/.test(name)) {
      name = name.substring(1, name.length - 1);
    }
    input =
      input.substring(0, array.index) +
      (context.variables[name] ?? context.environment[name] ?? "") +
      input.substring(array.index + array[0].length);
  }

  return input;
};

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
