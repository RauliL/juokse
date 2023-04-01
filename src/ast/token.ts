import { JuokseError } from "../error";
import { Position } from "./position";

export type WordType = "Backtick" | "DoubleQuote" | "SingleQuote" | "Word";

export type TokenType =
  | WordType
  | "Dedent"
  | "Indent"
  | "KeywordElse"
  | "KeywordFor"
  | "KeywordIf"
  | "KeywordPass"
  | "KeywordWhile"
  | "NewLine"
  | "Word"
  | ":"
  | ";";

export type Token = {
  position: Position;
  type: TokenType;
};

export type Word = Token & {
  type: WordType;
  text: string;
};

export type WordVisitor<R, A = undefined> = {
  visitBacktick: (word: Word, arg: A) => R;
  visitDoubleQuote: (word: Word, arg: A) => R;
  visitSingleQuote: (word: Word, arg: A) => R;
  visitWord: (word: Word, arg: A) => R;
};

export const visitWord = <R, A = undefined>(
  visitor: WordVisitor<R, A>,
  word: Word,
  arg: A
): R => {
  switch (word.type) {
    case "Backtick":
      return visitor.visitBacktick(word, arg);

    case "DoubleQuote":
      return visitor.visitDoubleQuote(word, arg);

    case "SingleQuote":
      return visitor.visitSingleQuote(word, arg);

    case "Word":
      return visitor.visitWord(word, arg);
  }

  throw new JuokseError(`Unrecognized word type: ${word.type}`, word.position);
};
