import chalk, { ChalkFunction } from "chalk";
import { program } from "commander";
import { format } from "date-fns";
import fs from "fs";
import stripAnsi from "strip-ansi";

import { compile } from "./compiler";
import { Context } from "./context";
import { executeScript } from "./execute";
import { ExitStatus } from "./status";

const options = {
  stripAnsi: false,
  timeStampFormat: "HH:mm:ss",
};

export function run() {
  const context = createContext();

  program
    // TODO: Read version from package.json.
    .version("1.0.0")
    .usage("[options] <file> [arguments]")
    .option("-s, --strip-ansi", "Strip ANSI escape codes from process outputs")
    .option("-t, --time-stamp-format [format]", "Specify format of timestamps")
    .parse(process.argv);

  if (program.opts().stripAnsi) {
    options.stripAnsi = true;
  }
  if (program.opts().timeStampFormat != null) {
    options.timeStampFormat = program.opts().timeStampFormat;
  }

  if (!program.args.length || program.args[0] === "-") {
    compileFromStdin(context);
  } else {
    compileFromFile(context, program.args[0]);
  }
}

function createContext(): Context {
  const instance = new Context();

  // Copy environment variables from system into context.
  Object.assign(instance.environment, process.env);

  instance.on("exit", (status) => process.exit(status));

  instance.on("process start", ({ executable, args }) => {
    log(`${[executable, ...args].join(" ")}`, process.stdout, chalk.green);
  });

  instance.stdout.on("data", (data) => log(data, process.stdout));
  instance.stderr.on("data", (data) => log(data, process.stderr, chalk.red));

  return instance;
}

function compileFromFile(context: Context, filename: string) {
  compile(filename, fs.readFileSync(filename, "utf-8"))
    .then((nodes) =>
      executeScript(context, nodes, (err) => {
        log(err, process.stderr, chalk.red);
        process.exit(ExitStatus.ERROR);
      })
    )
    .catch((err) => {
      process.stderr.write(`${err}\n`);
      process.exit(ExitStatus.ERROR);
    });
}

function compileFromStdin(context: Context) {
  let source = "";

  process.stdin.resume();
  process.stdin.on("data", (buffer) => {
    source += buffer.toString();
  });
  process.stdin.on("end", () => {
    compile("<stdin>", source)
      .then((nodes) =>
        executeScript(context, nodes, (err) => {
          log(err, process.stderr, chalk.red);
          process.exit(ExitStatus.ERROR);
        })
      )
      .catch((err) => {
        process.stderr.write(`${err}\n`);
        process.exit(ExitStatus.ERROR);
      });
  });
}

function log(
  input: Buffer | Error | string,
  stream: NodeJS.WriteStream,
  color: ChalkFunction | null = null
) {
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
}
