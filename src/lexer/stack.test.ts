import { Stack } from "./stack";

describe("class Stack", () => {
  describe("empty()", () => {
    it("should return `true` when the stack is empty", () =>
      expect(new Stack().empty()).toBe(true));

    it("should return `false` when the stack is not empty", () => {
      const stack = new Stack();

      stack.push("test");

      expect(stack.empty()).toBe(false);
    });
  });

  describe("push()", () => {
    it("should insert elements into the stack", () => {
      const stack = new Stack();

      stack.push("foo");
      stack.push("bar");

      expect(stack).toHaveProperty(["elements", 0], "foo");
      expect(stack).toHaveProperty(["elements", 1], "bar");
    });
  });

  describe("pop()", () => {
    it("should throw error if the stack is empty", () =>
      expect(() => new Stack().pop()).toThrow());

    it("should remove and return the top element from the stack", () => {
      const stack = new Stack();

      stack.push("foo");
      stack.push("bar");

      expect(stack.pop()).toBe("bar");
      expect(stack).toHaveProperty(["elements", "length"], 1);
    });
  });

  describe("top()", () => {
    it("should throw error if the stack is empty", () =>
      expect(() => new Stack().top()).toThrow());

    it("should return the top element from the stack", () => {
      const stack = new Stack();

      stack.push("foo");
      stack.push("bar");

      expect(stack.top()).toBe("bar");
      expect(stack).toHaveProperty(["elements", "length"], 2);
    });
  });
});
