import os from "os";
import path from "path";

import { Statement } from "./ast";
import { Context } from "./context";
import { ExitStatus } from "./status";

describe("class Context", () => {
  describe("#cwd", () => {
    it("should return current working directory by default", () =>
      expect(new Context().cwd).toEqual(process.cwd()));

    it("should allow changing of current working directory", () => {
      const context = new Context();
      const libDir = path.join(process.cwd(), "lib");
      const rootDir =
        os.platform() === "win32" ? process.cwd().split(path.sep)[0] : "/";

      context.cwd = libDir;
      expect(context.cwd).toEqual(libDir);

      context.cwd = rootDir;
      expect(context.cwd).toEqual(rootDir);
    });

    it("should throw error when trying to set non-existing directory as cwd", () =>
      expect(() => {
        new Context().cwd = path.join(process.cwd(), "non-existent");
      }).toThrow());

    it("should treat '-' as previous working directory stored in $OLDPWD", () => {
      const context = new Context();
      const cwd = process.cwd();
      const binDir = path.join(cwd, "bin");
      const libDir = path.join(cwd, "lib");

      context.cwd = binDir;
      context.cwd = libDir;
      context.cwd = "-";

      expect(context.cwd).toEqual(binDir);
    });

    it("should do nothing when set to '-' and $OLDPWD is not set", () => {
      const context = new Context();
      const libDir = path.join(process.cwd(), "lib");

      context.environment.PWD = libDir;
      context.cwd = "-";

      expect(context.cwd).toEqual(libDir);
    });
  });

  describe("#home", () => {
    it("should return environment variable $HOME by default", () => {
      const context = new Context();

      context.environment.HOME = "/test";

      expect(context.home).toEqual("/test");
    });

    it("should fallback to user's real home directory", () =>
      expect(new Context().home).toEqual(os.homedir()));

    it("should allow changing home directory", () => {
      const context = new Context();
      const libDir = path.join(process.cwd(), "lib");

      context.home = libDir;

      expect(context.environment).toHaveProperty("HOME", libDir);
    });

    it("should throw error when trying to set non-existing directory as home directory", () =>
      expect(() => {
        new Context().home = path.join(process.cwd(), "non-existent");
      }).toThrow());
  });

  describe("#path", () => {
    it("should return empty path by default", () =>
      expect(new Context().path).toHaveLength(0));

    it("should allow array as new path", () => {
      const context = new Context();

      context.path = [];
      expect(context.environment.PATH).toEqual("");

      context.path = ["foo"];
      expect(context.environment.PATH).toEqual("foo");

      context.path = ["foo", "bar"];
      expect(context.environment.PATH).toEqual(`foo${path.delimiter}bar`);
    });

    it("should allow string as new path", () => {
      const context = new Context();

      context.path = "";
      expect(context.environment.PATH).toEqual("");

      context.path = "foo";
      expect(context.environment.PATH).toEqual("foo");

      context.path = `foo${path.delimiter}bar`;
      expect(context.environment.PATH).toEqual(`foo${path.delimiter}bar`);
    });
  });

  describe("resolveExecutable()", () => {
    it("should resolve no non-absolute executables by default", () =>
      expect(new Context().resolveExecutable("ls")).toBeNull());

    it("should resolve absolute executables", () => {
      const exe = path.join(process.cwd(), "bin", "juokse");

      expect(new Context().resolveExecutable(exe)).toEqual(exe);
    });

    it("should resolve builtin commands", () =>
      expect(typeof new Context().resolveExecutable("!")).toBe("function"));

    it("should resolve custom functions", () => {
      const context = new Context();
      const statement: Statement = {
        position: {
          filename: "test",
          line: 1,
          column: 1,
        },
        type: "Pass",
      };

      context.functions["foo"] = statement;

      expect(context.resolveExecutable("foo")).toBe(statement);
    });

    it("should resolve executables", () => {
      const context = new Context();
      const binDir = path.join(process.cwd(), "bin");

      context.path = binDir;
      expect(context.resolveExecutable("juokse")).toEqual(
        path.join(binDir, "juokse")
      );
    });
  });

  describe("execute()", () => {
    it("should reject non-existing executables", () =>
      expect(new Context().execute("non-existent")).rejects.toBeInstanceOf(
        Error
      ));

    it("should prioritize builtin commands over commands from file system", () =>
      expect(new Context().execute("false")).resolves.toEqual({
        status: ExitStatus.ERROR,
      }));
  });
});
