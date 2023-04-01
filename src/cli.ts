import chalk, { ChalkFunction } from "chalk";
import { program } from "commander";
import { format } from "date-fns";
import fs from "fs";
import { sync as readPackageSync } from "read-pkg";
import stripAnsi from "strip-ansi";

import { compile } from "./compiler";
import { Context } from "./context";
import { executeScript } from "./execute";
import { ExitStatus } from "./status";

type CommandLineOptions = {
  args: string[];
  echo: boolean;
  filename?: string;
  stripAnsi: boolean;
  timeStampFormat: "HH:mm:ss";
};

const parseCommandLineOptions = (): CommandLineOptions => {
  program
    .version(readPackageSync().version)
    .usage("[options] [file] [arguments]")
    .option("-s, --strip-ansi", "Strip ANSI escape codes from process outputs")
    .option("-t, --time-stamp-format [format]", "Specify format of timestamps")
    .option("--no-echo", "Do not output executed commands")
    .parse(process.argv);

  const opts = program.opts();
  let filename: string | undefined;
  let args: string[];

  if (program.args.length > 0) {
    args = program.args.slice(1);
    if (program.args[0] !== "-") {
      filename = program.args[0];
    }
  } else {
    args = [];
  }

  return {
    args,
    echo: opts.echo,
    filename,
    stripAnsi: opts.stripAnsi,
    timeStampFormat: opts.timeStampFormat ?? "HH:mm:ss",
  };
};

const log = (
  options: CommandLineOptions,
  input: Buffer | Error | string,
  stream: NodeJS.WriteStream,
  color: ChalkFunction | null = null
) => {
  // Convert buffer into string and remove any trailing new lines.
  const text = input.toString().replace(/(\r?\n){1,2}$/, "");

  if (!text.length) {
    return;
  }

  text.split(/\r?\n/).forEach((line) => {
    let timeStamp = "";

    if (options.timeStampFormat) {
      timeStamp = `[${chalk.grey(
        format(Date.now(), options.timeStampFormat)
      )}] `;
    }
    if (options.stripAnsi) {
      line = stripAnsi(line);
    }
    if (color) {
      line = color(line);
    }
    stream.write(`${timeStamp}${line.replace(/\r?\n$/, "")}\n`);
  });
};

const createContext = (options: CommandLineOptions): Context => {
  const instance = new Context();

  // Copy environment variables from system into context.
  Object.assign(instance.environment, process.env);

  instance.variables["0"] = options.filename ?? "";
  instance.variables["#"] = `${options.args.length}`;
  instance.variables["*"] = options.args.join(" ");
  for (let i = 0; i < options.args.length; ++i) {
    instance.variables[i + 1] = options.args[i];
  }

  instance.on("exit", (status) => process.exit(status));

  if (options.echo) {
    instance.on("process start", ({ executable, args }) => {
      log(
        options,
        `${[executable, ...args].join(" ")}`,
        process.stdout,
        chalk.green
      );
    });
  }

  instance.stdout.on("data", (data) => log(options, data, process.stdout));
  instance.stderr.on("data", (data) =>
    log(options, data, process.stderr, chalk.red)
  );

  return instance;
};

const execute = (
  options: CommandLineOptions,
  context: Context,
  source: string,
  filename: string
) => {
  compile(filename, source)
    .then((script) =>
      executeScript(context, script, (err) => {
        log(options, err, process.stderr, chalk.red);
        process.exit(ExitStatus.ERROR);
      })
    )
    .catch((err) => {
      process.stderr.write(`${err}\n`);
      process.exit(ExitStatus.ERROR);
    });
};

export const run = () => {
  const options = parseCommandLineOptions();
  const context = createContext(options);

  if (options.filename) {
    execute(
      options,
      context,
      fs.readFileSync(options.filename, "utf-8"),
      options.filename
    );
  } else {
    let source = "";

    process.stdin.resume();
    process.stdin.on("data", (buffer) => {
      source += buffer.toString();
    });
    process.stdin.on("end", () => {
      execute(options, context, source, "<stdin>");
    });
  }
};
