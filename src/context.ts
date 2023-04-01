import { spawn } from "child_process";
import { EventEmitter } from "events";
import fs from "fs";
import { isArray, isFunction } from "lodash";
import isExe from "isexe";
import os from "os";
import path from "path";
import { PassThrough } from "stream";

import { BuiltinCommandCallback, builtinCommandMapping } from "./builtins";
import { JuokseError } from "./error";
import { ExitStatus } from "./status";

export type ExecutionResult = {
  pid?: number;
  signal?: NodeJS.Signals | null;
  status: number;
};

/**
 * Class which represents context of an script execution.
 */
export class Context extends EventEmitter {
  public stdout: PassThrough;
  public readonly stderr: PassThrough;
  public readonly stdin: PassThrough;
  public readonly environment: Record<string, string>;
  public readonly variables: Record<string, string>;

  public constructor() {
    super();

    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.stdin = new PassThrough();

    this.environment = {};
    this.variables = {};
  }

  /**
   * Returns the current working directory of this context. Current working
   * directory path is stored into an environment variable called `PWD`, but if
   * that is empty, current working directory of the Node.js process is used
   * instead.
   *
   * @return Path of the current working directory of this context.
   */
  public get cwd(): string {
    return this.environment.PWD || process.cwd();
  }

  /**
   * Sets the current working directory of this context to path given as
   * argument.
   *
   * If the given path does not point to a valid directory in the underlying
   * file system, an exception is thrown.
   *
   * @param path Path to the new current working directory of this context.
   */
  public set cwd(path: string) {
    if (path === "-") {
      path = this.environment.OLDPWD;
      if (!path) {
        return;
      }
    }
    if (!fs.lstatSync(path).isDirectory()) {
      throw new JuokseError(`'${path}' is not a valid directory.`);
    }
    this.environment.OLDPWD = this.cwd;
    this.environment.PWD = path;
  }

  /**
   * Returns the home directory of user running this context. Home directory
   * path is stored into an environment variable called `HOME`, but if that is
   * empty, home directory path is requested from Node.js instead.
   *
   * @return Path to the home directory of the user running this context.
   */
  public get home(): string {
    return this.environment.HOME || os.homedir();
  }

  /**
   * Sets the home directory of this context to path given as argument.
   *
   * If the given path does not point to a valid directory in the underlying
   * file system, an exception is thrown.
   *
   * @param path Path to the new home directory in this context.
   */
  public set home(path: string) {
    if (!fs.lstatSync(path).isDirectory()) {
      throw new JuokseError(`'${path}' is not a valid directory.`);
    }
    this.environment.HOME = path;
  }

  /**
   * Returns directories from `PATH` environment variable in an array.
   *
   * @return Array of path components read from `PATH` environment variable or
   *         empty array if it's empty.
   */
  public get path(): string[] {
    const value = this.environment.PATH;

    if (!value) {
      return [];
    }

    return value.split(path.delimiter);
  }

  /**
   * Sets the `PATH` environment variable of this context to given value, which
   * can be either array of strings or a string.
   *
   * @param value New value for `PATH` environment variable of this context.
   */
  public set path(value: string | string[]) {
    if (isArray(value)) {
      this.environment.PATH = value.join(path.delimiter);
    } else {
      this.environment.PATH = `${value}`;
    }
  }

  /**
   * Determines location of an executable by searching for it from builtin
   * commands and directories included in this context's `PATH` environment
   * variable. Returns the full absolute path of the first suitable executable
   * found, or null if it cannot be found.
   *
   * This method also searches for builtin commands, such as 'cd'. If a
   * builtin command's name matches with given executable name, a function
   * callback is returned instead of a path. This function callback takes in
   * three arguments: context instance, name of the executable and variadic
   * amount of command line arguments given for the command. The function
   * callback returns exit status as integer, which is 0 if the builtin command
   * executed successfully and non-zero if an error occurred.
   *
   * @param executable Name of the executable to look for. If absolute path is
   *                   given, no search through `PATH` nor builtin commands is
   *                   being performed.
   * @return Either a function or full path to the first executable found from
   *         the file system that matches with given name of an executable, or
   *         null if no suitable match was found.
   */
  public resolveExecutable(
    executable: string
  ): BuiltinCommandCallback | string | null {
    if (path.isAbsolute(executable)) {
      return isExe.sync(executable) ? executable : null;
    }

    if (
      Object.prototype.hasOwnProperty.call(builtinCommandMapping, executable)
    ) {
      const builtin = builtinCommandMapping[executable];

      if (isFunction(builtin)) {
        return builtin;
      }
    }

    for (const pathComponent of this.path) {
      const candidate = path.join(pathComponent, executable);

      if (fs.existsSync(candidate) && isExe.sync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Executes given executable or builtin command with given command line
   * arguments. The method will launch the builtin command or executable found
   * from the file system and return it's exit status in a promise.
   *
   * @param executable Name of the executable or builtin command to execute
   *                   with given command line arguments.
   * @param args Optional command line arguments given for the executable or
   *             builtin command.
   * @return A promise that will contain an object containing the exit status
   *         of the executed executable, along with the process identifier
   *         signal that was used to kill the process, if the process was
   *         killed.
   */
  public execute(
    executable: string,
    ...args: string[]
  ): Promise<ExecutionResult> {
    const resolvedExecutable = this.resolveExecutable(executable);

    if (!resolvedExecutable) {
      return Promise.reject(
        new JuokseError(`No such file or directory: ${executable}`)
      );
    }

    this.emit("process start", { executable, args: args });

    if (isFunction(resolvedExecutable)) {
      return resolvedExecutable(this, executable, ...args).then((status) => {
        this.variables["?"] = `${status}`;
        this.emit("process finish", { executable, args, status });

        return { status };
      });
    }

    return new Promise<ExecutionResult>((resolve, reject) => {
      const childProcess = spawn(resolvedExecutable, args, {
        cwd: this.cwd,
        env: this.environment,
        argv0: executable,
        stdio: "pipe",
      });

      childProcess.on("error", reject);

      childProcess.on("close", (status, signal) => {
        this.variables["?"] = `${status}`;
        this.emit("process finish", { executable, args, status, signal });
        resolve({
          pid: childProcess.pid,
          status: status ?? ExitStatus.OK,
          signal,
        });
      });

      // TODO: Add support for pipes. Also pipe stdin from context by default.
      childProcess.stdout.on("data", (data) => this.stdout.emit("data", data));
      childProcess.stderr.on("data", (data) => this.stderr.emit("data", data));
    });
  }
}
