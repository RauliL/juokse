/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Token, TokenType, Word } from "../ast";
import { JuokseError } from "../error";
import { Stack } from "./stack";
import { State } from "./state";
import { isWordPart } from "./utils";

const RESERVED_KEYWORDS = new Map<string, TokenType>([
  ["def", "KeywordDef"],
  ["else", "KeywordElse"],
  ["for", "KeywordFor"],
  ["if", "KeywordIf"],
  ["pass", "KeywordPass"],
  ["while", "KeywordWhile"],
]);

const lexEscapeSequence = (state: State): string => {
  let c: string;

  if (state.eof()) {
    throw new JuokseError("Unterminated escape sequence.", state.position);
  }
  switch ((c = state.advance())) {
    case "b":
      return "\b";

    case "t":
      return "\t";

    case "n":
      return "\n";

    case "f":
      return "\f";

    case "r":
      return "\r";

    case '"':
    case "'":
    case "\\":
    case "/":
      return c;

    case "u": {
      let result = 0;

      for (let i = 0; i < 4; ++i) {
        if (state.eof()) {
          throw new JuokseError("Unterminated escape sequence", state.position);
        } else if (!/^[a-fA-F0-9]$/.test(state.current())) {
          throw new JuokseError(
            "Illegal Unicode hex escape sequence.",
            state.position
          );
        }
        if (state.current() >= "A" && state.current() <= "F") {
          result =
            result * 16 +
            (state.advance().codePointAt(0)! - "A".codePointAt(0)! + 10);
        } else if (state.current() >= "a" && state.current() <= "f") {
          result =
            result * 16 +
            (state.advance().codePointAt(0)! - "a".codePointAt(0)! + 10);
        } else {
          result =
            result * 16 +
            (state.advance().codePointAt(0)! - "0".codePointAt(0)!);
        }
      }

      return String.fromCodePoint(result);
    }

    default:
      throw new JuokseError("Unrecognized escape sequence.", state.position);
  }
};

const lexString = (state: State): Word => {
  const position = { ...state.position };
  const separator = state.advance();
  let text = "";

  for (;;) {
    if (state.eof()) {
      throw new JuokseError(
        `Unexpected end of input inside string literal: Missing \`${separator}'.`,
        position
      );
    } else if (state.peekRead("\\")) {
      if (separator === '"') {
        text += lexEscapeSequence(state);
      } else if (state.peekRead(separator)) {
        text += separator;
      } else {
        text += "\\";
      }
    } else if (state.peekRead(separator)) {
      break;
    } else {
      text += state.advance();
    }
  }

  return {
    position,
    type:
      separator === "`"
        ? "Backtick"
        : separator === '"'
        ? "DoubleQuote"
        : "SingleQuote",
    text,
  };
};

const lexWord = (state: State): Token => {
  const position = { ...state.position };
  let text = "";
  let isQuoted = false;

  for (;;) {
    if (state.peekRead("\\")) {
      text += lexEscapeSequence(state);
      isQuoted = true;
    } else if (state.peek(isWordPart)) {
      text += state.advance();
    } else if (text.length > 0) {
      break;
    } else {
      throw new JuokseError("Unexpected input; Missing word.", position);
    }
  }

  if (!isQuoted) {
    const keyword = RESERVED_KEYWORDS.get(text);

    if (keyword != null) {
      return {
        position,
        type: keyword,
      };
    }
  }

  return {
    position,
    type: "Word",
    text,
  } as Word;
};

const lexLogicalLine = (
  state: State,
  tokens: Token[],
  indentStack: Stack<number>
): void => {
  const position = { ...state.position };
  let indent = 0;
  const separatorCount = 0;

  // Parse indentation at beginning of line.
  while (state.peek(" ", "\t")) {
    indent += state.advance() === "\t" ? 8 : 1;
  }

  // If there is an comment after the initial indentation, skip that and call
  // it a day.
  if (state.peekRead("#")) {
    while (!state.eof()) {
      const c = state.advance();

      if (c === "\n") {
        break;
      }
    }
    return;
  }

  // If it's an empty line, then do nothing else.
  if (state.eof() || state.peekRead("\n")) {
    return;
  }

  // Then check if the indentation has changed from previous line.
  if (indentStack.empty()) {
    if (indent > 0) {
      indentStack.push(indent);
      tokens.push({ position, type: "Indent" });
    }
  } else {
    let previousIndent = indentStack.top();

    if (previousIndent > indent) {
      do {
        if (indentStack.empty()) {
          break;
        }
        previousIndent = indentStack.top();
        indentStack.pop();
        tokens.push({ position, type: "Dedent" });
        if (previousIndent < indent) {
          throw new JuokseError("Indentation mismatch.", state.position);
        }
      } while (previousIndent > indent);
    } else if (previousIndent < indent) {
      indentStack.push(indent);
      tokens.push({ position, type: "Indent" });
    }
  }

  // Lex tokens after initial indent.
  for (;;) {
    // End of input.
    if (state.eof()) {
      break;
    }

    // End of line.
    if (state.peekRead("\n") && separatorCount === 0) {
      tokens.push({ position: { ...state.position }, type: "NewLine" });
      break;
    }

    // Skip whitespace before the next token.
    if (state.peekRead(/\s/)) {
      continue;
    }

    // Skip comments.
    if (state.peekRead("#")) {
      while (!state.eof()) {
        const c = state.advance();

        if (c === "\n") {
          break;
        }
      }
      break;
    }

    // Separators.
    if (state.peek(":", ";")) {
      const position = { ...state.position };
      const separator = state.advance();

      tokens.push({
        position,
        type: separator as TokenType,
      });
      continue;
    }

    // TODO: Escaped new lines.

    if (state.peek("'", '"', "`")) {
      tokens.push(lexString(state));
      continue;
    }

    tokens.push(lexWord(state));
  }
};

export const lex = (
  filename: string,
  line: number,
  source: string
): Token[] => {
  const state = new State(filename, line, source);
  const tokens: Token[] = [];
  const indentStack = new Stack<number>();

  while (!state.eof()) {
    lexLogicalLine(state, tokens, indentStack);
  }

  if (!indentStack.empty()) {
    tokens.push({ position: { ...state.position }, type: "NewLine" });
    do {
      indentStack.pop();
      tokens.push({ position: { ...state.position }, type: "Dedent" });
    } while (!indentStack.empty());
  }

  return tokens;
};
