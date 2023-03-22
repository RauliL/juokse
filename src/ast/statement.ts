import { JuokseError } from "../error";
import { Position } from "./position";
import { Word } from "./token";

export type StatementType =
  | "Assignment"
  | "Block"
  | "Command"
  | "For"
  | "If"
  | "Pass"
  | "While";

export type Statement = {
  position: Position;
  type: StatementType;
};

export type AssignmentStatement = Statement & {
  type: "Assignment";
  variable: string;
  value: Word;
};

export type BlockStatement = Statement & {
  type: "Block";
  body: Statement[];
};

export type CommandStatement = Statement & {
  type: "Command";
  command: Word;
  args: Word[];
};

export type ForStatement = Statement & {
  type: "For";
  variable: string;
  subjects: Word[];
  body: Statement;
};

export type IfStatement = Statement & {
  type: "If";
  test: CommandStatement;
  then: Statement;
  else?: Statement;
};

export type PassStatement = Statement & {
  type: "Pass";
};

export type WhileStatement = Statement & {
  type: "While";
  test: CommandStatement;
  body: Statement;
};

export type StatementVisitor<R, A = undefined> = {
  visitAssignment: (statement: AssignmentStatement, arg: A) => R;
  visitBlock: (statement: BlockStatement, arg: A) => R;
  visitCommand: (statement: CommandStatement, arg: A) => R;
  visitFor: (statement: ForStatement, arg: A) => R;
  visitIf: (statement: IfStatement, arg: A) => R;
  visitPass: (statement: PassStatement, arg: A) => R;
  visitWhile: (statement: WhileStatement, arg: A) => R;
};

export const visitStatement = <R, A = undefined>(
  visitor: StatementVisitor<R, A>,
  statement: Statement,
  arg: A
): R => {
  switch (statement.type) {
    case "Assignment":
      return visitor.visitAssignment(statement as AssignmentStatement, arg);

    case "Block":
      return visitor.visitBlock(statement as BlockStatement, arg);

    case "Command":
      return visitor.visitCommand(statement as CommandStatement, arg);

    case "For":
      return visitor.visitFor(statement as ForStatement, arg);

    case "If":
      return visitor.visitIf(statement as IfStatement, arg);

    case "Pass":
      return visitor.visitPass(statement as PassStatement, arg);

    case "While":
      return visitor.visitWhile(statement as WhileStatement, arg);
  }

  throw new JuokseError(
    `Unrecognized statement type: ${statement.type}`,
    statement.position
  );
};
