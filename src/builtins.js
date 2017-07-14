import homedir from 'homedir';

const builtinCommands = {
  cd (context, ...args) {
    let directory;

    if (args.length < 2) {
      const home = homedir();

      // TODO: Decide whether home directory should be always read from `HOME`
      // environment variable instead.
      if (!home) {
        context.stderr.write(`${args[0]}: Unable to determine home directory\n`);
        return 1;
      }
      directory = home;
    } else if (args.length > 2) {
      context.stderr.write(`${args[0]}: Too many arguments\n`);
      return 1;
    } else {
      directory = args[1];
    }

    try {
      context.cwd = directory;
    } catch (err) {
      context.stderr.write(`${args[0]}: Directory '${directory}' does not exist\n`);
      return 1;
    }

    return 0;
  },

  pwd (context, ...args) {
    if (args.length > 1) {
      context.stderr.write(`${args[0]}: Too many arguments\n`);
      return 1;
    }

    context.stdout.write(context.cwd);

    return 0;
  }
};

export default builtinCommands;
