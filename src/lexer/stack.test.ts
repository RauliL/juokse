import { Stack } from "./stack";

describe("class Stack", () => {
  it("should throw an exception if attempting to remove item from empty stack", () => {
    const stack = new Stack();

    expect(() => stack.pop()).toThrowError();
  });

  it("should throw an exception if attempting to access item from empty stack", () => {
    const stack = new Stack();

    expect(() => stack.top()).toThrowError();
  });
});
