import path from 'path';
import through from 'through';

import isArray from 'lodash/isArray';
import isDirectory from 'is-directory';

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
}
