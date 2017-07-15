import homedir from 'homedir';

function builtinCommand (minArgCount, maxArgCount, callback) {
  return function (context, executable, ...args) {
    if (args.length < minArgCount) {
      context.stderr.write(`${executable}: Too few arguments\n`);

      return 1;
    } else if (args.length > maxArgCount) {
      context.stderr.write(`${executable}: Too many arguments\n`);

      return 1;
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

      return 1;
    }
    directory = home;
  }

  try {
    context.cwd = directory;
  } catch (err) {
    context.stderr.write(`Directory '${directory}' does not exist\n`);

    return 1;
  }

  return 0;
});

const builtinCommandPwd = builtinCommand(0, 0, (context) => {
  context.stdout.write(context.cwd);

  return 0;
});

export default {
  cd: builtinCommandCd,
  false: builtinCommand(0, 0, () => 1),
  pwd: builtinCommandPwd,
  true: builtinCommand(0, 0, () => 0)
};
