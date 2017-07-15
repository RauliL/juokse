import homedir from 'homedir';

import isUndefined from 'lodash/isUndefined';

import {
  EXIT_STATUS_ERROR,
  EXIT_STATUS_INVALID_ARGS,
  EXIT_STATUS_OK
} from './status';

function builtinCommand (minArgCount, maxArgCount, callback) {
  return function (context, executable, ...args) {
    if (args.length < minArgCount) {
      context.stderr.write(`${executable}: Too few arguments\n`);

      return EXIT_STATUS_INVALID_ARGS;
    } else if (args.length > maxArgCount) {
      context.stderr.write(`${executable}: Too many arguments\n`);

      return EXIT_STATUS_INVALID_ARGS;
    }

    return callback(context, ...args);
  };
}

const builtinCommandCd = builtinCommand(0, 1, (context, directory) => {
  if (!directory) {
    const home = homedir();

    // TODO: Decide whether home directory should be always read from `HOME`
    // environment variable instead.
    if (!home) {
      context.stderr.write(`Unable to determine home directory\n`);

      return EXIT_STATUS_ERROR;
    }
    directory = home;
  }

  try {
    context.cwd = directory;
  } catch (err) {
    context.stderr.write(`Directory '${directory}' does not exist\n`);

    return EXIT_STATUS_ERROR;
  }

  return EXIT_STATUS_OK;
});

const builtinCommandExit = builtinCommand(0, 1, (context, status) => {
  if (isUndefined(status)) {
    status = EXIT_STATUS_OK;
  } else {
    try {
      status = parseInt(status);
    } catch (err) {
      process.stderr.write(`Argument '${status}' must be an integer\n`);

      return EXIT_STATUS_ERROR;
    }
  }
  context.emit('exit', status);

  return EXIT_STATUS_OK;
});

const builtinCommandPwd = builtinCommand(0, 0, (context) => {
  context.stdout.write(context.cwd);

  return EXIT_STATUS_OK;
});

export default {
  cd: builtinCommandCd,
  exit: builtinCommandExit,
  false: builtinCommand(0, 0, () => EXIT_STATUS_ERROR),
  pwd: builtinCommandPwd,
  true: builtinCommand(0, 0, () => EXIT_STATUS_OK)
};
