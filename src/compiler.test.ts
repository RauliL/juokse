import { describe, expect, it } from "vitest";

import { compile } from "./compiler";
import { JuokseError } from "./error";

describe("compile()", () => {
  it("should be able to compile simple scripts", () =>
    expect(
      compile("test", "#!/usr/bin/env juokse\necho foo\n")
    ).resolves.toEqual([
      {
        position: { filename: "test", line: 2, column: 1 },
        type: "Command",
        command: {
          position: { filename: "test", line: 2, column: 1 },
          type: "Word",
          text: "echo",
        },
        args: [
          {
            position: { filename: "test", line: 2, column: 6 },
            type: "Word",
            text: "foo",
          },
        ],
      },
    ]));

  it("should return failed promise when syntax error is occurred", () =>
    expect(compile("test", "  foo")).rejects.toBeInstanceOf(JuokseError));
});
