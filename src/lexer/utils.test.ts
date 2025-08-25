import { describe, expect, it } from "vitest";

import { isNewLine, isWordPart } from "./utils";

describe("isNewLine()", () => {
  it.each([
    ["\n", true],
    ["\r", true],
    [" ", false],
    ["a", false],
  ])(
    "should be able to distinguish new line characters from other characters",
    (input, expectedResult) => {
      expect(isNewLine(input)).toBe(expectedResult);
    }
  );
});

describe("isWordPart()", () => {
  it.each([
    ["a", true],
    ["$", true],
    ["_", true],
    [":", false],
    [";", false],
    [" ", false],
  ])(
    "should be able to distinguish word characters from other other characters",
    (input, expectedResult) => {
      expect(isWordPart(input)).toBe(expectedResult);
    }
  );
});
