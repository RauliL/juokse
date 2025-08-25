import { beforeEach, describe, expect, it, vi } from "vitest";

import { JuokseError } from "../error";
import { Position } from "./position";
import { Word, WordType, WordVisitor, visitWord } from "./token";

describe("visitWord()", () => {
  const visitBacktick = vi.fn();
  const visitDoubleQuote = vi.fn();
  const visitSingleQuote = vi.fn();
  const visitSimpleWord = vi.fn();
  const visitor: Readonly<WordVisitor<undefined, undefined>> = {
    visitBacktick,
    visitDoubleQuote,
    visitSingleQuote,
    visitWord: visitSimpleWord,
  };
  const position: Readonly<Position> = {
    filename: "test",
    line: 1,
    column: 1,
  };

  beforeEach(() => {
    visitBacktick.mockReset();
    visitDoubleQuote.mockReset();
    visitSingleQuote.mockReset();
    visitSimpleWord.mockReset();
  });

  it("should visit backtick", () => {
    visitWord(visitor, { position, type: "Backtick", text: "test" }, undefined);

    expect(visitBacktick).toBeCalled();
  });

  it("should visit double quoted string", () => {
    visitWord(
      visitor,
      { position, type: "DoubleQuote", text: "test" },
      undefined
    );

    expect(visitDoubleQuote).toBeCalled();
  });

  it("should visit single quoted string", () => {
    visitWord(
      visitor,
      { position, type: "SingleQuote", text: "test" },
      undefined
    );

    expect(visitSingleQuote).toBeCalled();
  });

  it("should visit double quoted string", () => {
    visitWord(visitor, { position, type: "Word", text: "test" }, undefined);

    expect(visitSimpleWord).toBeCalled();
  });

  it("should throw error if word type cannot be determined", () =>
    expect(() =>
      visitWord(
        visitor,
        { position, type: "Unknown" as WordType, text: "test" } as Word,
        undefined
      )
    ).toThrow(JuokseError));
});
