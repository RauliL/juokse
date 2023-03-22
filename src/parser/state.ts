import { Position, Token, TokenType, Word } from "../ast";
import { JuokseError } from "../error";

const WORD_TYPES = new Set<TokenType>(["DoubleQuote", "SingleQuote", "Word"]);

export class State {
  public readonly tokens: Token[];
  public offset: number;

  public constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.offset = 0;
  }

  public get position(): Position | undefined {
    return this.offset >= this.tokens.length
      ? undefined
      : this.tokens[this.offset].position;
  }

  public eof(): boolean {
    return this.offset >= this.tokens.length;
  }

  public peek(type: TokenType): boolean {
    return !this.eof() && this.tokens[this.offset].type === type;
  }

  public peekWord(): boolean {
    return !this.eof() && WORD_TYPES.has(this.tokens[this.offset].type);
  }

  public peekRead(type: TokenType): boolean {
    if (this.peek(type)) {
      ++this.offset;

      return true;
    }

    return false;
  }

  public read<T extends Token = Token>(expectedType: TokenType): T {
    if (!this.eof()) {
      const token = this.tokens[this.offset];

      if (token.type !== expectedType) {
        throw new JuokseError(
          `Unexpected ${token.type}; Missing ${expectedType}.`,
          token.position
        );
      }
      ++this.offset;

      return token as T;
    }

    throw new JuokseError(`Unexpected end of input; Missing ${expectedType}.`);
  }

  public readWord(): Word {
    if (!this.peekWord()) {
      throw new JuokseError(
        `Unexpected end of input; Missing word.`,
        this.position
      );
    }

    return this.advance() as Word;
  }

  public advance(): Token {
    if (this.eof()) {
      throw new JuokseError("Unexpected end of input.");
    }

    return this.tokens[this.offset++];
  }
}
