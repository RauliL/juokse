import { Position } from "./ast";

export class JuokseError extends Error {
  public readonly position?: Position;

  public constructor(message: string, position?: Position) {
    super(
      position ? `${position.filename}:${position.line}: ${message}` : message
    );
    this.position = position;
    Object.setPrototypeOf(this, JuokseError.prototype);
  }
}

export class CommandExitError extends JuokseError {
  public constructor(message: string, position?: Position) {
    super(message, position);
    Object.setPrototypeOf(this, CommandExitError.prototype);
  }
}

export class CommandKilledError extends JuokseError {
  public constructor(message: string, position?: Position) {
    super(message, position);
    Object.setPrototypeOf(this, CommandKilledError.prototype);
  }
}

export class BreakError extends JuokseError {
  public readonly n: number;

  public constructor(n: number) {
    super("Used 'break' outside loop.");
    this.n = n;
    Object.setPrototypeOf(this, BreakError.prototype);
  }
}

export class ContinueError extends JuokseError {
  public readonly n: number;

  public constructor(n: number) {
    super("Used 'continue' outside loop.");
    this.n = n;
    Object.setPrototypeOf(this, ContinueError.prototype);
  }
}
