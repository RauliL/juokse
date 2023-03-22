export enum ExitStatus {
  /** Status code used for normal exit in a command. */
  OK = 0,
  /** Status code used for failure exit in a command. */
  ERROR = 1,
  /** Status code used for invalid arguments given to a command. */
  INVALID_ARGS = 121,
}
