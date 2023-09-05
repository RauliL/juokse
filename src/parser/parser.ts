import {
  AssignmentStatement,
  BlockStatement,
  CommandStatement,
  ForStatement,
  FunctionDefinition,
  IfStatement,
  PassStatement,
  Position,
  Statement,
  Token,
  WhileStatement,
  Word,
} from "../ast";
import { JuokseError } from "../error";
import { State } from "./state";

export const parseBlockStatement = (
  state: State,
  position: Position
): BlockStatement => {
  const body: Statement[] = [];

  if (state.peekRead("NewLine")) {
    state.read("Indent");
    for (;;) {
      parseStatement(state, body);
      if (state.eof() || state.peekRead("Dedent")) {
        break;
      }
    }
  } else {
    parseStatementList(state, body);
  }

  return {
    position,
    type: "Block",
    body,
  };
};

export const parseFunctionDefinition = (state: State): FunctionDefinition => {
  const { position } = state.read("KeywordDef");
  const name = state.read<Word>("Word").text;

  state.read(":");

  return {
    position,
    type: "FunctionDefinition",
    name,
    body: parseBlockStatement(state, position),
  };
};

export const parseForStatement = (state: State): ForStatement => {
  const { position } = state.read("KeywordFor");
  const variable = state.read<Word>("Word").text;
  const subjects: Word[] = [];

  if (
    !state.peek("Word") ||
    (state.tokens[state.offset] as Word).text !== "in"
  ) {
    throw new JuokseError("Missing `in' after `'for'.", position);
  }
  state.advance();
  do {
    subjects.push(state.readWord());
  } while (!state.peekRead(":"));

  return {
    position,
    type: "For",
    variable,
    subjects,
    body: parseBlockStatement(state, position),
  };
};

export const parseIfStatement = (state: State): IfStatement => {
  const { position } = state.read("KeywordIf");
  const test = parseCommandStatement(state);

  state.read(":");

  const thenClause = parseBlockStatement(state, position);
  let elseClause: Statement | undefined;

  if (state.peekRead("KeywordElse")) {
    if (state.peek("KeywordIf")) {
      elseClause = parseIfStatement(state);
    } else {
      state.read(":");
      elseClause = parseBlockStatement(state, position);
    }
  }

  return {
    position,
    type: "If",
    test,
    then: thenClause,
    else: elseClause,
  };
};

export const parseWhileStatement = (state: State): WhileStatement => {
  const { position } = state.read("KeywordWhile");
  const test = parseCommandStatement(state);

  state.read(":");

  return {
    position,
    type: "While",
    test,
    body: parseBlockStatement(state, position),
  };
};

export const parseCommandStatement = (state: State): CommandStatement => {
  const command = state.readWord();
  const args: Word[] = [];

  while (state.peekWord()) {
    args.push(state.advance() as Word);
  }

  return {
    position: command.position,
    type: "Command",
    command,
    args,
  };
};

export const parsePassStatement = (state: State): PassStatement => ({
  position: state.read("KeywordPass").position,
  type: "Pass",
});

export const parseAssignmentStatement = (state: State): AssignmentStatement => {
  const { position, text: variable } = state.readWord();

  // Skip "=".
  state.read("Word");

  return {
    position,
    type: "Assignment",
    variable,
    value: state.readWord(),
  };
};

export const parseSimpleStatement = (state: State): Statement => {
  if (state.eof()) {
    throw new JuokseError(
      "Unexpected end of input; Missing statement.",
      state.position
    );
  }

  if (state.peek("KeywordPass")) {
    return parsePassStatement(state);
  } else if (
    state.peekWord() &&
    state.offset + 1 < state.tokens.length &&
    state.tokens[state.offset + 1].type === "Word" &&
    (state.tokens[state.offset + 1] as Word).text === "="
  ) {
    return parseAssignmentStatement(state);
  }

  return parseCommandStatement(state);
};

export const parseStatementList = (state: State, output: Statement[]): void => {
  output.push(parseSimpleStatement(state));
  while (state.peekRead(";")) {
    if (state.eof() || state.peek("NewLine")) {
      return;
    }
    output.push(parseSimpleStatement(state));
  }
};

export const parseStatement = (state: State, output: Statement[]): void => {
  if (state.eof()) {
    throw new JuokseError(
      "Unexpected end of input; Missing statement.",
      state.position
    );
  }

  switch (state.tokens[state.offset].type) {
    case "KeywordDef":
      output.push(parseFunctionDefinition(state));
      break;

    case "KeywordFor":
      output.push(parseForStatement(state));
      break;

    case "KeywordIf":
      output.push(parseIfStatement(state));
      break;

    case "KeywordWhile":
      output.push(parseWhileStatement(state));
      break;

    case "NewLine":
      state.advance();
      break;

    default:
      parseStatementList(state, output);
      break;
  }
};

export const parse = (tokens: Token[]): Statement[] => {
  const state = new State(tokens);
  const output: Statement[] = [];

  while (!state.eof()) {
    if (!state.peekRead("NewLine")) {
      parseStatement(state, output);
    }
  }

  return output;
};
