import { ExitStatus } from "../status";
import { builtinCommandBreak } from "./break";
import { builtinCommandCd } from "./cd";
import { builtinCommandContinue } from "./continue";
import { builtinCommandEcho } from "./echo";
import { builtinCommandExit } from "./exit";
import { builtinCommandNot } from "./not";
import { builtinCommandPrintf } from "./printf";
import { builtinCommandPwd } from "./pwd";
import { builtinCommandReturn } from "./return";
import { builtinCommandSource } from "./source";
import { BuiltinCommandCallback } from "./types";
import { builtinCommandUnset } from "./unset";
import { builtinCommand } from "./utils";
import { builtinCommandWhich } from "./which";

export { BuiltinCommandCallback } from "./types";

export const builtinCommandMapping: Record<string, BuiltinCommandCallback> = {
  "!": builtinCommandNot,
  ".": builtinCommandSource,
  break: builtinCommandBreak,
  cd: builtinCommandCd,
  continue: builtinCommandContinue,
  echo: builtinCommandEcho,
  exit: builtinCommandExit,
  false: builtinCommand(0, 0, () => Promise.resolve(ExitStatus.ERROR)),
  pwd: builtinCommandPwd,
  printf: builtinCommandPrintf,
  return: builtinCommandReturn,
  source: builtinCommandSource,
  true: builtinCommand(0, 0, () => Promise.resolve(ExitStatus.OK)),
  unset: builtinCommandUnset,
  which: builtinCommandWhich,
};
