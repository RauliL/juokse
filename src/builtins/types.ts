import { Context } from "../context";

export type BuiltinCommandCallback = (
  context: Context,
  executable: string,
  ...args: string[]
) => Promise<number>;
