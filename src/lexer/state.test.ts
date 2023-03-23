import { JuokseError } from "../error";
import { State } from "./state";

describe("class State", () => {
  describe("eof()", () => {
    it("should return `true` if there are no more characters to be read", () =>
      expect(new State("test", "").eof()).toBe(true));

    it("should return `false` if there are more characters to be read", () =>
      expect(new State("test", "a").eof()).toBe(false));
  });

  describe("current()", () => {
    it("should return next character if there are more characters to be read", () =>
      expect(new State("test", "a").current()).toBe("a"));

    it("should throw error if there are no more characters to be read", () =>
      expect(() => new State("test", "").current()).toThrow(JuokseError));
  });

  describe("peek()", () => {
    it("should return `false` if there are no more characters to be read", () =>
      expect(new State("test", "").peek("a")).toBe(false));

    it.each([
      [true, "a", "a"],
      [false, "a", "b"],
      [true, "a", /[a-z]/],
      [false, "b", /[0-9]/],
      [true, "a", () => true],
      [false, "b", () => false],
    ])(
      "should return %p when the next character is %p and given pattern is %p",
      (expectedResult, input, pattern) =>
        expect(new State("test", input).peek(pattern)).toBe(expectedResult)
    );
  });

  describe("peekRead()", () => {
    it("should return false if the next character does not match given pattern", () =>
      expect(new State("test", "a").peekRead("b")).toBe(false));

    it("should return true and advance when the next character matches given pattern", () => {
      const state = new State("test", "a");

      expect(state.peekRead("a")).toBe(true);
      expect(state).toHaveProperty("offset", 1);
    });
  });

  describe("advance()", () => {
    it("should throw error if there are no more characters to be read", () =>
      expect(() => new State("test", "").advance()).toThrow(JuokseError));

    it("should return next character from the source code", () =>
      expect(new State("test", "a").advance()).toBe("a"));

    it.each(["\n", "\r"])(
      "should increase line number when new line is encountered",
      (input) => {
        const state = new State("test", input);

        expect(state.advance()).toBe("\n");
        expect(state).toHaveProperty(["position", "line"], 2);
        expect(state).toHaveProperty(["position", "column"], 1);
      }
    );
  });
});
