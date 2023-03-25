import {
  AssignmentStatement,
  BlockStatement,
  CommandStatement,
  Position,
} from "./ast";
import { Context } from "./context";
import { CommandExitError, JuokseError } from "./error";
import { visitor } from "./execute";
import { ExitStatus } from "./status";

const position: Readonly<Position> = {
  filename: "test",
  line: 1,
  column: 1,
};

describe("visitor", () => {
  describe("visitAssignment()", () => {
    it("should assign context variable", () => {
      const context = new Context();

      return visitor
        .visitAssignment(
          {
            position,
            type: "Assignment",
            variable: "test",
            value: { position, type: "Word", text: "test" },
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).toHaveProperty(["variables", "test"], "test");
        });
    });

    it("should fail if unable to expand the value", () =>
      expect(
        visitor.visitAssignment(
          {
            position,
            type: "Assignment",
            variable: "test",
            value: { position, type: "Word", text: "*.zzz" },
          },
          new Context()
        )
      ).rejects.toBeInstanceOf(JuokseError));
  });

  describe("visitBlock()", () => {
    it("should execute all statements inside the block", () => {
      const context = new Context();

      return visitor
        .visitBlock(
          {
            position,
            type: "Block",
            body: [
              {
                position,
                type: "Assignment",
                variable: "test1",
                value: { position, type: "SingleQuote", text: "test" },
              } as AssignmentStatement,
              {
                position,
                type: "Assignment",
                variable: "test2",
                value: { position, type: "SingleQuote", text: "test" },
              } as AssignmentStatement,
            ],
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).toHaveProperty(["variables", "test1"], "test");
          expect(context).toHaveProperty(["variables", "test2"], "test");
        });
    });

    it("should fail if any of the statements inside the block fail", () =>
      expect(
        visitor.visitBlock(
          {
            position,
            type: "Block",
            body: [
              {
                position,
                type: "Command",
                command: { position, type: "Word", text: "true" },
                args: [],
              } as CommandStatement,
              {
                position,
                type: "Command",
                command: { position, type: "Word", text: "false" },
                args: [],
              } as CommandStatement,
              {
                position,
                type: "Command",
                command: { position, type: "Word", text: "true" },
                args: [],
              } as CommandStatement,
            ],
          },
          new Context()
        )
      ).rejects.toBeInstanceOf(CommandExitError));
  });

  describe("visitCommand()", () => {
    it("should return exit code of the executed command", () =>
      expect(
        visitor.visitCommand(
          {
            position,
            type: "Command",
            command: { position, type: "Word", text: "true" },
            args: [],
          },
          new Context()
        )
      ).resolves.toEqual({ status: ExitStatus.OK }));

    it("should expand any arguments given for the command", () =>
      expect(
        visitor.visitCommand(
          {
            position,
            type: "Command",
            command: { position, type: "Word", text: "!" },
            args: [{ position, type: "Word", text: "false" }],
          },
          new Context()
        )
      ).resolves.toEqual({ status: ExitStatus.OK }));

    it("should fail if execution of the command fails", () =>
      expect(
        visitor.visitCommand(
          {
            position,
            type: "Command",
            command: { position, type: "Word", text: "false" },
            args: [],
          },
          new Context()
        )
      ).rejects.toBeInstanceOf(CommandExitError));
  });

  describe("visitFor()", () => {
    it("should execute body of the loop once for each subject", () => {
      const context = new Context();

      return visitor
        .visitFor(
          {
            position,
            type: "For",
            variable: "i",
            subjects: [
              {
                position,
                type: "Word",
                text: "foo",
              },
              {
                position,
                type: "Word",
                text: "bar",
              },
              {
                position,
                type: "Word",
                text: "baz",
              },
            ],
            body: {
              position,
              type: "Assignment",
              variable: "test",
              value: {
                position,
                type: "DoubleQuote",
                text: "${test}${i}",
              },
            } as AssignmentStatement,
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).toHaveProperty(["variables", "test"], "foobarbaz");
        });
    });

    it("should allow breaking out from the loop", () => {
      const context = new Context();

      return visitor
        .visitFor(
          {
            position,
            type: "For",
            variable: "i",
            subjects: [
              {
                position,
                type: "Word",
                text: "foo",
              },
              {
                position,
                type: "Word",
                text: "bar",
              },
              {
                position,
                type: "Word",
                text: "baz",
              },
            ],
            body: {
              position,
              type: "Block",
              body: [
                {
                  position,
                  type: "Assignment",
                  variable: "test",
                  value: {
                    position,
                    type: "Word",
                    text: "${test}${i}",
                  },
                } as AssignmentStatement,
                {
                  position,
                  type: "Command",
                  command: {
                    position,
                    type: "Word",
                    text: "break",
                  },
                  args: [],
                } as CommandStatement,
              ],
            } as BlockStatement,
          },
          context
        )
        .then(() => {
          expect(context).toHaveProperty(["variables", "test"], "foo");
        });
    });
  });

  describe("visitIf()", () => {
    it("should execute then clause if the condition succeeds", () => {
      const context = new Context();

      return visitor
        .visitIf(
          {
            position,
            type: "If",
            test: {
              position,
              type: "Command",
              command: { position, type: "Word", text: "true" },
              args: [],
            },
            then: {
              position,
              type: "Assignment",
              variable: "test",
              value: { position, type: "Word", text: "test" },
            } as AssignmentStatement,
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).toHaveProperty(["variables", "test"], "test");
        });
    });

    it("should not execute then clause if the condition fails", () => {
      const context = new Context();

      return visitor
        .visitIf(
          {
            position,
            type: "If",
            test: {
              position,
              type: "Command",
              command: { position, type: "Word", text: "false" },
              args: [],
            },
            then: {
              position,
              type: "Assignment",
              variable: "test",
              value: { position, type: "Word", text: "test" },
            } as AssignmentStatement,
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).not.toHaveProperty(["variables", "test"], "test");
        });
    });

    it("should execute else clause if the condition fails", () => {
      const context = new Context();

      return visitor
        .visitIf(
          {
            position,
            type: "If",
            test: {
              position,
              type: "Command",
              command: { position, type: "Word", text: "false" },
              args: [],
            },
            then: {
              position,
              type: "Assignment",
              variable: "test",
              value: { position, type: "Word", text: "fail" },
            } as AssignmentStatement,
            else: {
              position,
              type: "Assignment",
              variable: "test",
              value: { position, type: "Word", text: "test" },
            } as AssignmentStatement,
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).toHaveProperty(["variables", "test"], "test");
        });
    });
  });

  describe("visitPass()", () => {
    it("should just return OK exit status", () =>
      expect(
        visitor.visitPass({ position, type: "Pass" }, new Context())
      ).resolves.toEqual({ status: ExitStatus.OK }));
  });

  describe("visitWhile()", () => {
    it("should execute body of the while loop as long as the condition succeeds", () => {
      const context = new Context();

      return visitor
        .visitWhile(
          {
            position,
            type: "While",
            test: {
              position,
              type: "Command",
              command: { position, type: "Word", text: "false" },
              args: [],
            },
            body: {
              position,
              type: "Assignment",
              variable: "test",
              value: { position, type: "Word", text: "test" },
            } as AssignmentStatement,
          },
          context
        )
        .then((result) => {
          expect(result).toEqual({ status: ExitStatus.OK });
          expect(context).not.toHaveProperty(["variables", "test"]);
        });
    });

    it("should allow breaking out from the loop", () => {
      const context = new Context();

      return visitor
        .visitWhile(
          {
            position,
            type: "While",
            test: {
              position,
              type: "Command",
              command: { position, type: "Word", text: "true" },
              args: [],
            },
            body: {
              position,
              type: "Block",
              body: [
                {
                  position,
                  type: "Assignment",
                  variable: "test",
                  value: { position, type: "DoubleQuote", text: "${test}test" },
                } as AssignmentStatement,
                {
                  position,
                  type: "Command",
                  command: { position, type: "Word", text: "break" },
                  args: [],
                } as CommandStatement,
              ],
            } as BlockStatement,
          },
          context
        )
        .then(() => {
          expect(context).toHaveProperty(["variables", "test"], "test");
        });
    });
  });
});
