import os from "os";
import path from "path";

import { Context } from "./context";

describe("class Context", () => {
  describe("#cwd", () => {
    it("should return current working directory by default", () => {
      expect(new Context().cwd).toEqual(process.cwd());
    });

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

    it("should throw error when trying to set non-existing directory as cwd", () => {
      expect(() => {
        new Context().cwd = path.join(process.cwd(), "non-existent");
      }).toThrow();
    });
  });

  describe("#path", () => {
    it("should return empty path by default", () => {
      expect(new Context().path).toHaveLength(0);
    });

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

  describe("#resolveExecutable()", () => {
    it("should resolve no executables by default", () => {
      expect(new Context().resolveExecutable("ls")).toBeNull();
    });

    it("should resolve builtin commands", () => {
      expect(typeof new Context().resolveExecutable("!")).toBe("function");
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

  describe("#execute()", () => {
    it("should reject non-existing executables", () =>
      expect(new Context().execute("non-existent")).rejects.toBeInstanceOf(
        Error
      ));
  });
});
