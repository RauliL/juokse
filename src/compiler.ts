import { Statement } from "./ast";
import { lex } from "./lexer";
import { parse } from "./parser";

export const compile = (
  filename: string,
  source: string
): Promise<Statement[]> =>
  new Promise<Statement[]>((resolve, reject) => {
    try {
      resolve(parse(lex(filename, source)));
    } catch (err) {
      reject(err);
    }
  });
