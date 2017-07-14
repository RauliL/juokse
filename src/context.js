import builtinCommands from './builtins';
import path from 'path';
import through from 'through';

import isArray from 'lodash/isArray';
import isDirectory from 'is-directory';
import isExecutable from 'is-executable';
import isFunction from 'lodash/isFunction';

import { spawn } from 'child_process';

/**
 * Class which represents context of an script execution.
 */
export default class Context {
  constructor () {
    this.stdout = through();
    this.stderr = through();
    this.stdin = through();

    this.environment = {};
  }

  /**
   * Returns the current working directory of this context. Current working
   * directory path is stored into an environment variable called `PWD`, but if
   * that is empty, current working directory of the Node.js process is used
   * instead.
   *
   * @return {string} Path of the current working directory of this context.
   */
  get cwd () {
    return this.environment.PWD || process.cwd();
  }

  /**
   * Sets the current working directory of this context to path given as
   * argument.
   *
   * If the given path does not point to a valid directory in the underlying
   * file system, an exception is thrown.
   *
   * @param {string} path Path to the new current working directory of this
   *                      context.
   */
  set cwd (path) {
    if (!isDirectory.sync(path)) {
      throw new Error(`'${path}' is not a valid directory`);
    }
    this.environment.PWD = path;
  }

  /**
   * Returns directories from `PATH` environment variable in an array.
   *
   * @return {array} Array of path components read from `PATH` environment
   *                 variable or empty array if it's empty.
   */
  get path () {
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
   * @param {(array|string)} value New value for `PATH` environment variable of
   *                               this context.
   */
  set path (value) {
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
   * @param {string} executable Name of the executable to look for. If absolute
   *                            path is given, no search through `PATH` nor
   *                            builtin commands is being performed.
   * @return {?(function|string)} Either a function or full path to the first
   *                              executable found from the file system that
   *                              matches with given name of an executable, or
   *                              null if no suitable match was found.
   */
  resolveExecutable (executable) {
    if (path.isAbsolute(executable)) {
      return isExecutable.sync(executable) ? executable : null;
    }

    if (builtinCommands.hasOwnProperty(executable)) {
      const builtin = builtinCommands[executable];

      if (isFunction(builtin)) {
        return builtin;
      }
    }

    for (let pathComponent of this.path) {
      const candidate = path.join(pathComponent, executable);

      if (isExecutable.sync(candidate)) {
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
   * @param {string} executable Name of the executable or builtin command to
   *                            execute with given command line arguments.
   * @param {...string} args Optional command line arguments given for the
   *                         executable or builtin command.
   * @return {Promise} A promise that will contain an object containing the
   *                   exit status of the executed executable, along with the
   *                   process identifier singal that was used to kill the
   *                   process, if the process was killed.
   */
  execute (executable, ...args) {
    const resolvedExecutable = this.resolveExecutable(executable);

    if (!resolvedExecutable) {
      return Promise.reject(new Error(`No such file or directory: ${executable}`));
    }

    // TODO: Expand variable names and wildcards from arguments.

    if (isFunction(resolvedExecutable)) {
      return new Promise((resolve, reject) => {
        let status;

        try {
          status = resolvedExecutable(this, executable, ...args);
        } catch (err) {
          reject(err);
          return;
        }

        resolve({ status });
      });
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn(resolvedExecutable, args, {
        cwd: this.cwd,
        env: this.environment,
        argv0: executable,
        stdio: 'pipe'
      });

      childProcess.on('error', reject);

      childProcess.on('close', (status, signal) => {
        resolve({
          pid: childProcess.pid,
          status,
          signal
        });
      });

      // TODO: Add support for pipes. Also pipe stdin from context by default.
      childProcess.stdout.on('data', data => this.stdout.emit('data', data));
      childProcess.stderr.on('data', data => this.stderr.emit('data', data));
    });
  }
}
