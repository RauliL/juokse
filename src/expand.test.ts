import path from "path";
import { WordType } from "./ast";

import { Context } from "./context";
import { JuokseError } from "./error";
import { expandWord } from "./expand";

describe("expandWord()", () => {
  const context = new Context();

  context.cwd = path.join(path.resolve(__dirname), "..");
  context.variables.foo = "bar";
  context.variables.bar = "foo bar baz";

  it("should expand variables inside double quoted strings", () =>
    expect(
      expandWord(context, {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "DoubleQuote",
        text: "$foo",
      })
    ).resolves.toEqual(["bar"]));

  it("should not expand variables inside single quoted strings", () =>
    expect(
      expandWord(context, {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "SingleQuote",
        text: "$foo",
      })
    ).resolves.toEqual(["$foo"]));

  it("should expand variables inside simple words", () =>
    expect(
      expandWord(context, {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Word",
        text: "foo${foo}",
      })
    ).resolves.toEqual(["foobar"]));

  it("should replace non-existent variables with empty strings", () =>
    expect(
      expandWord(context, {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Word",
        text: "${nonexistent}",
      })
    ).resolves.toEqual([""]));

  it("should replace multiple variables inside double quoted string", () =>
    expect(
      expandWord(context, {
        position: { filename: "test", line: 1, column: 1 },
        type: "DoubleQuote",
        text: "${foo}test${foo}",
      })
    ).resolves.toEqual(["bartestbar"]));

  it("should expand globs inside simple words", () =>
    expect(
      expandWord(context, {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Word",
        text: "*.json",
      })
    ).resolves.toHaveLength(3));

  it.each(["DoubleQuote" as WordType, "SingleQuote" as WordType])(
    "should not expand globs inside strings",
    (type) =>
      expect(
        expandWord(context, {
          position: {
            filename: "test",
            line: 1,
            column: 1,
          },
          type,
          text: "*.json",
        })
      ).resolves.toEqual(["*.json"])
  );

  it("should fail if unable to expand globs", () =>
    expect(
      expandWord(context, {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Word",
        text: "*.zzz",
      })
    ).rejects.toBeInstanceOf(JuokseError));

  it("should treat whitespaces inside words as an array", () =>
    expect(
      expandWord(context, {
        position: { filename: "test", line: 1, column: 1 },
        type: "Word",
        text: "$bar",
      })
    ).resolves.toEqual(["foo", "bar", "baz"]));

  it("should not treat whitespaces inside double quoted string as an array", () =>
    expect(
      expandWord(context, {
        position: { filename: "test", line: 1, column: 1 },
        type: "DoubleQuote",
        text: "$bar",
      })
    ).resolves.toEqual(["foo bar baz"]));
});
