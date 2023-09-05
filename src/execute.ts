import { flatten } from "lodash";

import {
  AssignmentStatement,
  BlockStatement,
  CommandStatement,
  ForStatement,
  FunctionDefinition,
  IfStatement,
  Statement,
  StatementVisitor,
  visitStatement,
  WhileStatement,
} from "./ast";
import { Context, ExecutionResult } from "./context";
import {
  BreakError,
  CommandExitError,
  CommandKilledError,
  ContinueError,
} from "./error";
import { expandWord } from "./expand";
import { ExitStatus } from "./status";

export const visitor: StatementVisitor<Promise<ExecutionResult>, Context> = {
  async visitAssignment(
    statement: AssignmentStatement,
    context: Context
  ): Promise<ExecutionResult> {
    const value = (await expandWord(context, statement.value)).join(" ");

    context.variables[statement.variable] = value;

    return { status: ExitStatus.OK };
  },

  visitBlock(
    statement: BlockStatement,
    context: Context
  ): Promise<ExecutionResult> {
    return statement.body.reduce(
      (promise, child) =>
        promise.then(() => visitStatement(visitor, child, context)),
      Promise.resolve<ExecutionResult>({ status: ExitStatus.OK })
    );
  },

  async visitCommand(
    statement: CommandStatement,
    context: Context
  ): Promise<ExecutionResult> {
    const command = await expandWord(context, statement.command).then(
      (result) => result.join(" ")
    );
    const args = flatten(
      await Promise.all(statement.args.map((arg) => expandWord(context, arg)))
    );
    const result = await context.execute(command, ...args);

    if (result.signal || result.status !== ExitStatus.OK) {
      const id = [command, ...args].join(" ");

      if (result.signal) {
        throw new CommandKilledError(
          `'${id}' was killed with signal ${result.signal}`
        );
      }

      throw new CommandExitError(`'${id}' exited with status ${result.status}`);
    }

    return result;
  },

  async visitFor(
    statement: ForStatement,
    context: Context
  ): Promise<ExecutionResult> {
    for (const subject of statement.subjects) {
      let canContinue = true;

      for (const value of await expandWord(context, subject)) {
        context.variables[statement.variable] = value;

        const loopStatus = await executeLoopBody(context, statement.body);

        if (loopStatus === "break") {
          canContinue = false;
          break;
        } else if (loopStatus === "continue") {
          continue;
        }
      }

      if (!canContinue) {
        break;
      }
    }

    return { status: ExitStatus.OK };
  },

  async visitFunctionDefinition(
    statement: FunctionDefinition,
    context: Context
  ): Promise<ExecutionResult> {
    context.functions[statement.name] = statement.body;

    return { status: ExitStatus.OK };
  },

  async visitIf(
    statement: IfStatement,
    context: Context
  ): Promise<ExecutionResult> {
    const result = await evaluateCommand(context, statement.test);

    if (result.status === ExitStatus.OK) {
      return visitStatement(visitor, statement.then, context);
    } else if (statement.else) {
      return visitStatement(visitor, statement.else, context);
    }

    return { status: ExitStatus.OK };
  },

  async visitPass(): Promise<ExecutionResult> {
    return { status: ExitStatus.OK };
  },

  async visitWhile(
    statement: WhileStatement,
    context: Context
  ): Promise<ExecutionResult> {
    for (;;) {
      const { status } = await evaluateCommand(context, statement.test);

      if (status == ExitStatus.OK) {
        const loopStatus = await executeLoopBody(context, statement.body);

        if (loopStatus === "break") {
          break;
        } else if (loopStatus === "continue") {
          continue;
        }
      } else {
        break;
      }
    }

    return { status: ExitStatus.OK };
  },
};

const evaluateCommand = (
  context: Context,
  command: CommandStatement
): Promise<ExecutionResult> =>
  visitor
    .visitCommand(command, context)
    .catch((error) =>
      error instanceof CommandExitError
        ? { status: ExitStatus.ERROR }
        : Promise.reject(error)
    );

const executeLoopBody = async (
  context: Context,
  statement: Statement
): Promise<"break" | "continue" | undefined> => {
  try {
    await visitStatement(visitor, statement, context);
  } catch (err) {
    if (err instanceof BreakError) {
      if (err.n > 1) {
        throw new BreakError(err.n - 1);
      }

      return "break";
    } else if (err instanceof ContinueError) {
      if (err.n > 1) {
        throw new ContinueError(err.n - 1);
      }

      return "continue";
    }

    throw err;
  }
};

export const executeScript = async (
  context: Context,
  script: Statement[]
): Promise<void> => {
  let index = 0;
  const executeNextStatement = async (): Promise<void> => {
    const statement = script[index++];

    if (statement) {
      await visitStatement(visitor, statement, context);
      await executeNextStatement();
    }
  };

  if (script.length > 0) {
    await executeNextStatement();
  }
};
