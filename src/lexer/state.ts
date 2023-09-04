import { isRegExp } from "lodash";

import { Position } from "../ast";
import { JuokseError } from "../error";
import { isNewLine } from "./utils";

export class State {
  public readonly position: Position;
  private readonly source: string;
  private offset: number;

  public constructor(filename: string, line: number, source: string) {
    this.position = {
      filename,
      line,
      column: 1,
    };
    this.source = source;
    this.offset = 0;
  }

  public eof(): boolean {
    return this.offset >= this.source.length;
  }

  public current(): string {
    if (this.eof()) {
      throw new JuokseError("Unexpected end of input.", this.position);
    }

    return this.source[this.offset];
  }

  public peek(
    ...expected: Array<string | RegExp | ((input: string) => boolean)>
  ): boolean {
    if (!this.eof()) {
      const c = this.source[this.offset];

      for (const expectedPart of expected) {
        if (typeof expectedPart === "string") {
          if (c === expectedPart) {
            return true;
          }
        } else if (isRegExp(expectedPart)) {
          if (expectedPart.test(c)) {
            return true;
          }
        } else if (expectedPart(c)) {
          return true;
        }
      }
    }

    return false;
  }

  public peekRead(expected: string | RegExp): boolean {
    if (!this.peek(expected)) {
      return false;
    }
    this.advance();

    return true;
  }

  public advance(): string {
    if (!this.eof()) {
      const c = this.source[this.offset++];

      if (isNewLine(c)) {
        if (c === "\r") {
          this.peekRead("\n");
        }
        ++this.position.line;
        this.position.column = 1;

        return "\n";
      }
      ++this.position.column;

      return c;
    }

    throw new JuokseError("Unexpected end of input.", this.position);
  }
}
