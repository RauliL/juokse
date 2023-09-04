import { Position } from "../ast";
import { JuokseError } from "../error";
import { lex } from "../lexer";
import {
  parseAssignmentStatement,
  parseBlockStatement,
  parseCommandStatement,
  parseForStatement,
  parseIfStatement,
  parsePassStatement,
  parseSimpleStatement,
  parseStatement,
  parseStatementList,
  parseWhileStatement,
} from "./parser";
import { State } from "./state";

const mockPosition: Readonly<Position> = {
  filename: "test",
  line: 1,
  column: 1,
};

const createState = (source: string) =>
  new State(lex(mockPosition.filename, 1, source));

describe("parseBlockStatement()", () => {
  it("should require indentation after new line", () =>
    expect(
      parseBlockStatement(
        new State([
          {
            position: mockPosition,
            type: "NewLine",
          },
          {
            position: mockPosition,
            type: "Indent",
          },
          {
            position: mockPosition,
            type: "KeywordPass",
          },
        ]),
        mockPosition
      )
    ).toEqual({
      position: mockPosition,
      type: "Block",
      body: [
        {
          position: mockPosition,
          type: "Pass",
        },
      ],
    }));

  it("should require statement list if there is no new line", () =>
    expect(
      parseBlockStatement(createState("pass; pass"), mockPosition)
    ).toEqual({
      position: mockPosition,
      type: "Block",
      body: [
        {
          position: mockPosition,
          type: "Pass",
        },
        {
          position: {
            ...mockPosition,
            column: 7,
          },
          type: "Pass",
        },
      ],
    }));
});

describe("parseForStatement()", () => {
  it('should require keyword "for"', () =>
    expect(() => parseForStatement(createState("while"))).toThrow(JuokseError));

  it('should require an variable after "for" keyword', () =>
    expect(() => parseForStatement(createState("for 'failure'"))).toThrow(
      JuokseError
    ));

  it('should require keyword "in" after variable', () =>
    expect(() => parseForStatement(createState("for variable wihle"))).toThrow(
      JuokseError
    ));

  it('should require word list after "in" keyword', () =>
    expect(() =>
      parseForStatement(createState("for variable in while"))
    ).toThrow(JuokseError));

  it('should be able to parse an "for" statement', () =>
    expect(
      parseForStatement(createState("for variable in foo bar: pass"))
    ).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "For",
      variable: "variable",
      subjects: [
        {
          position: { filename: "test", line: 1, column: 17 },
          type: "Word",
          text: "foo",
        },
        {
          position: { filename: "test", line: 1, column: 21 },
          type: "Word",
          text: "bar",
        },
      ],
      body: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Block",
        body: [
          { position: { filename: "test", line: 1, column: 26 }, type: "Pass" },
        ],
      },
    }));
});

describe("parseIfStatement()", () => {
  it('should require keyword "if"', () =>
    expect(() => parseIfStatement(createState("while"))).toThrow(JuokseError));

  it('should require command statement after "if" keyword', () =>
    expect(() => parseIfStatement(createState("if while"))).toThrow(
      JuokseError
    ));

  it('should require ":" separator after command statement', () =>
    expect(() => parseIfStatement(createState("if true ;"))).toThrow(
      JuokseError
    ));

  it('should require block statement after ":" separator', () =>
    expect(() => parseIfStatement(createState("if true :"))).toThrow(
      JuokseError
    ));

  it('should be able to parse "if" statement', () =>
    expect(parseIfStatement(createState("if true : pass"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "If",
      test: {
        position: { filename: "test", line: 1, column: 4 },
        type: "Command",
        command: {
          position: { filename: "test", line: 1, column: 4 },
          type: "Word",
          text: "true",
        },
        args: [],
      },
      then: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Block",
        body: [
          { position: { filename: "test", line: 1, column: 11 }, type: "Pass" },
        ],
      },
    }));

  it('should be able to parse "if" statement with "else" clause', () =>
    expect(
      parseIfStatement(createState("if true : \n  pass\nelse :\n  pass"))
    ).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "If",
      test: {
        position: { filename: "test", line: 1, column: 4 },
        type: "Command",
        command: {
          position: { filename: "test", line: 1, column: 4 },
          type: "Word",
          text: "true",
        },
        args: [],
      },
      then: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Block",
        body: [
          { position: { filename: "test", line: 2, column: 3 }, type: "Pass" },
        ],
      },
      else: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Block",
        body: [
          { position: { filename: "test", line: 4, column: 3 }, type: "Pass" },
        ],
      },
    }));

  it('should be able to parse "if" statement with "else if" clause', () =>
    expect(
      parseIfStatement(
        createState("if true : \n  pass\nelse if false :\n  pass")
      )
    ).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "If",
      test: {
        position: { filename: "test", line: 1, column: 4 },
        type: "Command",
        command: {
          position: { filename: "test", line: 1, column: 4 },
          type: "Word",
          text: "true",
        },
        args: [],
      },
      then: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Block",
        body: [
          { position: { filename: "test", line: 2, column: 3 }, type: "Pass" },
        ],
      },
      else: {
        position: { filename: "test", line: 3, column: 6 },
        type: "If",
        test: {
          position: { filename: "test", line: 3, column: 9 },
          type: "Command",
          command: {
            position: { filename: "test", line: 3, column: 9 },
            type: "Word",
            text: "false",
          },
          args: [],
        },
        then: {
          position: { filename: "test", line: 3, column: 6 },
          type: "Block",
          body: [
            {
              position: { filename: "test", line: 4, column: 3 },
              type: "Pass",
            },
          ],
        },
      },
    }));
});

describe("parseWhileStatement()", () => {
  it('should require "while" keyword', () =>
    expect(() => parseWhileStatement(createState("for"))).toThrow(JuokseError));

  it('should require command statement after "while" keyword', () =>
    expect(() => parseWhileStatement(createState("while if"))).toThrow(
      JuokseError
    ));

  it('should require ":" after command statement', () =>
    expect(() => parseWhileStatement(createState("while true;"))).toThrow(
      JuokseError
    ));

  it('should be able to parse "while" statement', () =>
    expect(parseWhileStatement(createState("while true : \n  pass"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "While",
      test: {
        position: { filename: "test", line: 1, column: 7 },
        type: "Command",
        command: {
          position: { filename: "test", line: 1, column: 7 },
          type: "Word",
          text: "true",
        },
        args: [],
      },
      body: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Block",
        body: [
          { position: { filename: "test", line: 2, column: 3 }, type: "Pass" },
        ],
      },
    }));
});

describe("parseCommandStatement()", () => {
  it("should require word", () =>
    expect(() => parseCommandStatement(createState("while"))).toThrow(
      JuokseError
    ));

  it("should be able to parse command statement without arguments", () =>
    expect(parseCommandStatement(createState("true"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Command",
      command: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Word",
        text: "true",
      },
      args: [],
    }));

  it("should be able to parse command statement with arguments", () =>
    expect(parseCommandStatement(createState("[ $foo != bar ]"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Command",
      command: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Word",
        text: "[",
      },
      args: [
        {
          position: { filename: "test", line: 1, column: 3 },
          type: "Word",
          text: "$foo",
        },
        {
          position: { filename: "test", line: 1, column: 8 },
          type: "Word",
          text: "!=",
        },
        {
          position: { filename: "test", line: 1, column: 11 },
          type: "Word",
          text: "bar",
        },
        {
          position: { filename: "test", line: 1, column: 15 },
          type: "Word",
          text: "]",
        },
      ],
    }));
});

describe("parsePassStatement()", () => {
  it('should require "pass" keyword', () =>
    expect(() => parsePassStatement(createState("while"))).toThrow(
      JuokseError
    ));

  it('should be able to parse "pass" statement', () =>
    expect(parsePassStatement(createState("pass"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Pass",
    }));
});

describe("parseAssignmentStatement()", () => {
  it("should require word", () =>
    expect(() => parseAssignmentStatement(createState("while = foo"))).toThrow(
      JuokseError
    ));

  it('should require "=" after the word', () =>
    expect(() => parseAssignmentStatement(createState("foo : foo"))).toThrow(
      JuokseError
    ));

  it('should require word after "="', () =>
    expect(() => parseAssignmentStatement(createState("foo = ;"))).toThrow(
      JuokseError
    ));

  it("should be able to parse assignment statement", () =>
    expect(parseAssignmentStatement(createState("foo = foo"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Assignment",
      variable: "foo",
      value: {
        position: { filename: "test", line: 1, column: 7 },
        type: "Word",
        text: "foo",
      },
    }));
});

describe("parseSimpleStatement()", () => {
  it("should fail if there are no more tokens to be read", () =>
    expect(() => parseSimpleStatement(new State([]))).toThrow(JuokseError));

  it('should be able to parse "pass" statement', () =>
    expect(parseSimpleStatement(createState("pass"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Pass",
    }));

  it("should be able to parse assignment statement", () =>
    expect(parseSimpleStatement(createState("foo = foo"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Assignment",
      variable: "foo",
      value: {
        position: { filename: "test", line: 1, column: 7 },
        type: "Word",
        text: "foo",
      },
    }));

  it("should be able to parse command statement", () =>
    expect(parseSimpleStatement(createState("true"))).toEqual({
      position: { filename: "test", line: 1, column: 1 },
      type: "Command",
      command: {
        position: { filename: "test", line: 1, column: 1 },
        type: "Word",
        text: "true",
      },
      args: [],
    }));
});

describe("parseStatementList()", () => {
  it("should be able to parse single simple statement", () => {
    const output = [];

    parseStatementList(createState("pass"), output);

    expect(output).toEqual([
      {
        position: { filename: "test", line: 1, column: 1 },
        type: "Pass",
      },
    ]);
  });

  it('should be able to parse single simple statement followed by ";"', () => {
    const output = [];

    parseStatementList(createState("pass ;"), output);

    expect(output).toEqual([
      {
        position: { filename: "test", line: 1, column: 1 },
        type: "Pass",
      },
    ]);
  });

  it('should be able to parse multiple simple statements separated by ";"', () => {
    const output = [];

    parseStatementList(createState("pass ; pass ; pass"), output);

    expect(output).toEqual([
      { position: { filename: "test", line: 1, column: 1 }, type: "Pass" },
      { position: { filename: "test", line: 1, column: 8 }, type: "Pass" },
      { position: { filename: "test", line: 1, column: 15 }, type: "Pass" },
    ]);
  });
});

describe("parseStatement()", () => {
  it("should fail if there are no more tokens to be read", () =>
    expect(() => parseStatement(new State([]), [])).toThrow(JuokseError));

  it('should be able to parse "for" statement', () => {
    const output = [];

    parseStatement(createState("for variable in foo bar : pass"), output);

    expect(output).toHaveProperty([0, "type"], "For");
  });

  it('should be able to parse "if" statement', () => {
    const output = [];

    parseStatement(createState("if true : pass"), output);

    expect(output).toHaveProperty([0, "type"], "If");
  });

  it('should be able to parse "while" statement', () => {
    const output = [];

    parseStatement(createState("while true : pass"), output);

    expect(output).toHaveProperty([0, "type"], "While");
  });

  it("should ignore all new lines", () => {
    const output = [];

    parseStatement(
      new State([{ position: mockPosition, type: "NewLine" }]),
      output
    );

    expect(output).toHaveLength(0);
  });

  it("should be able to parse statement list", () => {
    const output = [];

    parseStatement(createState("pass"), output);

    expect(output).toHaveProperty([0, "type"], "Pass");
  });
});
