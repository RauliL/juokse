import { JuokseError } from "../error";
import { lex } from "./lexer";

describe("lex()", () => {
  it("should return nothing when there is nothing to lex", () => {
    expect(lex("test", 1, "")).toHaveLength(0);
  });

  it("should ignore comments", () => {
    expect(lex("test", 1, "# This should be ignored.\n")).toHaveLength(0);
  });

  it("should ignore empty lines", () => {
    expect(lex("test", 1, "  \t  \n")).toHaveLength(0);
  });

  it("should be able to detect when indentation is increased", () => {
    expect(lex("test", 1, "  foo")).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Indent",
      },
      {
        position: {
          filename: "test",
          line: 1,
          column: 3,
        },
        type: "Word",
        text: "foo",
      },
      {
        position: {
          filename: "test",
          line: 1,
          column: 6,
        },
        type: "NewLine",
      },
      {
        position: {
          filename: "test",
          line: 1,
          column: 6,
        },
        type: "Dedent",
      },
    ]);
  });

  it("should be able to lex simple words", () => {
    expect(lex("test", 1, "foo bar")).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Word",
        text: "foo",
      },
      {
        position: {
          filename: "test",
          line: 1,
          column: 5,
        },
        type: "Word",
        text: "bar",
      },
    ]);
  });

  it("should parse escape sequences in simple words", () => {
    expect(lex("test", 1, "a\\u0030")).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Word",
        text: "a0",
      },
    ]);
  });

  it.each([
    ["else", "KeywordElse"],
    ["for", "KeywordFor"],
    ["if", "KeywordIf"],
    ["pass", "KeywordPass"],
    ["while", "KeywordWhile"],
  ])(
    "should be able to distinguish reserved keywords from simple words",
    (input, expectedType) => {
      expect(lex("test", 1, input)).toHaveProperty([0, "type"], expectedType);
    }
  );

  it.each([":", ";"])("should be able to lex separators", (separator) => {
    expect(lex("test", 1, separator)).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: separator,
      },
    ]);
  });

  it("should be able to lex double quoted strings", () => {
    expect(lex("test", 1, '"foo"')).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "DoubleQuote",
        text: "foo",
      },
    ]);
  });

  it("should be able to lex single quoted strings", () => {
    expect(lex("test", 1, "'foo'")).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "SingleQuote",
        text: "foo",
      },
    ]);
  });

  it("should parse escape sequences inside double quoted strings", () => {
    expect(lex("test", 1, '"\\u0030"')).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "DoubleQuote",
        text: "0",
      },
    ]);
  });

  it("should not parse escape sequences inside single quoted strings", () => {
    expect(lex("test", 1, "'\\u0030'")).toEqual([
      {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "SingleQuote",
        text: "\\u0030",
      },
    ]);
  });

  it("should throw exception if unable to parse an escape sequence", () => {
    expect(() => lex("test", 1, '"\\z"')).toThrowError(JuokseError);
  });
});
