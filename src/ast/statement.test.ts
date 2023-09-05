import { JuokseError } from "../error";
import { Position } from "./position";
import {
  AssignmentStatement,
  BlockStatement,
  CommandStatement,
  ForStatement,
  IfStatement,
  PassStatement,
  Statement,
  StatementVisitor,
  WhileStatement,
  visitStatement,
  StatementType,
  FunctionDefinition,
} from "./statement";

describe("visitStatement()", () => {
  const visitAssignment = jest.fn();
  const visitBlock = jest.fn();
  const visitCommand = jest.fn();
  const visitFor = jest.fn();
  const visitFunctionDefinition = jest.fn();
  const visitIf = jest.fn();
  const visitPass = jest.fn();
  const visitWhile = jest.fn();
  const visitor: Readonly<StatementVisitor<undefined, undefined>> = {
    visitAssignment,
    visitBlock,
    visitCommand,
    visitFor,
    visitFunctionDefinition,
    visitIf,
    visitPass,
    visitWhile,
  };
  const position: Readonly<Position> = {
    filename: "test",
    line: 1,
    column: 1,
  };

  beforeEach(() => {
    visitAssignment.mockReset();
    visitBlock.mockReset();
    visitCommand.mockReset();
    visitFor.mockReset();
    visitFunctionDefinition.mockReset();
    visitIf.mockReset();
    visitPass.mockReset();
    visitWhile.mockReset();
  });

  it("should visit assignment statement", () => {
    visitStatement(
      visitor,
      {
        position,
        type: "Assignment",
        variable: "test",
        value: { position, type: "Word", text: "test" },
      } as AssignmentStatement,
      undefined
    );

    expect(visitAssignment).toBeCalled();
  });

  it("should visit block statement", () => {
    visitStatement(
      visitor,
      {
        position,
        type: "Block",
        body: [],
      } as BlockStatement,
      undefined
    );

    expect(visitBlock).toBeCalled();
  });

  it("should visit command statement", () => {
    visitStatement(
      visitor,
      {
        position,
        type: "Command",
        command: {
          position,
          type: "Word",
          text: "test",
        },
        args: [],
      } as CommandStatement,
      undefined
    );

    expect(visitCommand).toBeCalled();
  });

  it('should visit "for" statement', () => {
    visitStatement(
      visitor,
      {
        position,
        type: "For",
        variable: "test",
        subjects: [],
        body: {
          position,
          type: "Pass",
        },
      } as ForStatement,
      undefined
    );

    expect(visitFor).toBeCalled();
  });

  it("should visit function definition", () => {
    visitStatement(
      visitor,
      {
        position,
        type: "FunctionDefinition",
        name: "test",
        body: {
          position,
          type: "Pass",
        },
      } as FunctionDefinition,
      undefined
    );

    expect(visitFunctionDefinition).toBeCalled();
  });

  it('should visit "if" statement', () => {
    visitStatement(
      visitor,
      {
        position,
        type: "If",
        test: {
          position,
          type: "Command",
          command: {
            position,
            type: "Word",
            text: "test",
          },
          args: [],
        },
        then: {
          position,
          type: "Pass",
        },
      } as IfStatement,
      undefined
    );

    expect(visitIf).toBeCalled();
  });

  it('should visit "pass" statement', () => {
    visitStatement(
      visitor,
      {
        position,
        type: "Pass",
      } as PassStatement,
      undefined
    );

    expect(visitPass).toBeCalled();
  });

  it('should visit "while" statement', () => {
    visitStatement(
      visitor,
      {
        position,
        type: "While",
        test: {
          position,
          type: "Command",
          command: {
            position,
            type: "Word",
            text: "test",
          },
          args: [],
        },
        body: {
          position,
          type: "Pass",
        },
      } as WhileStatement,
      undefined
    );

    expect(visitWhile).toBeCalled();
  });

  it("should throw error if statement type cannot be recognized", () =>
    expect(() =>
      visitStatement(
        visitor,
        { position, type: "Unknown" as StatementType } as Statement,
        undefined
      )
    ).toThrow(JuokseError));
});
