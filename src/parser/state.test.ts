import { TokenType, Word } from "../ast";
import { JuokseError } from "../error";
import { State } from "./state";

describe("class State", () => {
  describe("#position", () => {
    it("should return position of next token", () =>
      expect(
        new State([
          { position: { filename: "test", line: 5, column: 7 }, type: ":" },
        ]).position
      ).toEqual({ filename: "test", line: 5, column: 7 }));

    it("should return `undefined` if there are no more tokens to be read", () =>
      expect(new State([]).position).toBeUndefined());
  });

  describe("eof()", () => {
    it("should return `true` when there are no more tokens to be read", () =>
      expect(new State([]).eof()).toBe(true));

    it("should return `false` if there are more tokens to be read", () =>
      expect(
        new State([
          { position: { filename: "test", line: 1, column: 1 }, type: ":" },
        ]).eof()
      ).toBe(false));
  });

  describe("peek()", () => {
    it("should return `false` if there are no more tokens to be read", () =>
      expect(new State([]).peek(":")).toBe(false));

    it.each([
      [true, ":" as TokenType, ":" as TokenType],
      [false, ":" as TokenType, ";" as TokenType],
    ])(
      "should return %p when next token is %p and expected token type is %p",
      (expectedResult, type, expectedType) =>
        expect(
          new State([
            { position: { filename: "test", line: 1, column: 1 }, type },
          ]).peek(expectedType)
        ).toBe(expectedResult)
    );
  });

  describe("peekWord()", () => {
    it("should return `false` if there are no more tokens to be read", () =>
      expect(new State([]).peekWord()).toBe(false));

    it.each([
      [true, "DoubleQuote" as TokenType],
      [true, "SingleQuote" as TokenType],
      [true, "Word" as TokenType],
      [false, ":" as TokenType],
    ])("should return %p when next token is %p", (expectedResult, type) =>
      expect(
        new State([
          { position: { filename: "test", line: 1, column: 1 }, type },
        ]).peekWord()
      ).toBe(expectedResult)
    );
  });

  describe("peekRead()", () => {
    it("should return `true` and advance if next token matches with the expected type", () => {
      const state = new State([
        { position: { filename: "test", line: 1, column: 1 }, type: ":" },
      ]);

      expect(state.peekRead(":")).toBe(true);
      expect(state).toHaveProperty("offset", 1);
    });

    it("should return `false` if the next token does not match with the expected type", () => {
      const state = new State([
        { position: { filename: "test", line: 1, column: 1 }, type: ":" },
      ]);

      expect(state.peekRead(";")).toBe(false);
      expect(state).toHaveProperty("offset", 0);
    });
  });

  describe("read()", () => {
    it("should throw error if there are no more tokens to be read", () =>
      expect(() => new State([]).read(":")).toThrow(JuokseError));

    it("should throw error if next token does not match with the expected type", () =>
      expect(() =>
        new State([
          { position: { filename: "test", line: 1, column: 1 }, type: ":" },
        ]).read(";")
      ).toThrow(JuokseError));

    it("should advance if next token matches with expected type", () => {
      const state = new State([
        { position: { filename: "test", line: 1, column: 1 }, type: ":" },
      ]);

      expect(state.read(":")).toHaveProperty("type", ":");
      expect(state).toHaveProperty("offset", 1);
    });
  });

  describe("readWord()", () => {
    it("should throw error if next token is not a word", () =>
      expect(() =>
        new State([
          { position: { filename: "test", line: 1, column: 1 }, type: ":" },
        ]).readWord()
      ).toThrow(JuokseError));

    it("should return the next token if it's a word", () =>
      expect(
        new State([
          {
            position: { filename: "test", line: 1, column: 1 },
            type: "DoubleQuote",
            text: "foo",
          } as Word,
        ]).readWord()
      ).toHaveProperty("text", "foo"));
  });

  describe("advance()", () => {
    it("should throw error if there are no more tokens to be read", () =>
      expect(() => new State([]).advance()).toThrow(JuokseError));

    it("should return next token where there are more tokens to be read", () => {
      const state = new State([
        {
          position: {
            filename: "test",
            line: 1,
            column: 1,
          },
          type: ":",
        },
      ]);

      expect(state.advance()).toHaveProperty("type", ":");
      expect(state).toHaveProperty("offset", 1);
    });
  });
});
