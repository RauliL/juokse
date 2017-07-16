import Context from './context';

import chalk from 'chalk';
import fs from 'fs';
import moment from 'moment';
import path from 'path';
import stripAnsi from 'strip-ansi';

import isUndefined from 'lodash/isUndefined';

import { EXIT_STATUS_ERROR } from './status';
import { parse } from './parser';
import { execVisitor } from './visitor';
import { version } from '../package.json';

const options = {
  stripAnsi: false,
  timeStampFormat: 'HH:mm:ss'
};

export function run () {
  const context = createContext();
  const program = require('commander');

  program
    .version(version)
    .usage('[options] <file> [arguments]')
    .option('-s, --strip-ansi', 'Strip ANSI escape codes from process outputs')
    .option('-t, --time-stamp-format [format]', 'Specify format of timestamps')
    .parse(process.argv);

  if (program.stripAnsi) {
    options.stripAnsi = true;
  }
  if (!isUndefined(program.timeStampFormat)) {
    options.timeStampFormat = program.timeStampFormat;
  }

  // TODO: Add support for reading input from stdin.
  if (!program.args.length || program.args[0] === '-') {
    process.stderr.write(`${path.basename(process.argv[1])}: Missing filename\n`);
    process.exit(EXIT_STATUS_ERROR);
  }

  compileFromFile(context, program.args[0]);
}

function createContext () {
  const instance = new Context();

  // Copy environment variables from system into context.
  Object.assign(instance.environment, process.env);

  instance.on('exit', status => process.exit(status));

  instance.on('process start', ({ executable, args }) => {
    log(`${[executable, ...args].join(' ')}`, process.stdout, chalk.green);
  });

  instance.stdout.on('data', data => log(data, process.stdout));
  instance.stderr.on('data', data => log(data, process.stderr, chalk.red));

  return instance;
}

function compileFromFile (context, filename) {
  execNodes(context, parse(fs.readFileSync(filename, 'utf-8')));
}

function execNodes (context, nodes) {
  let index = 0;
  const execNextNode = () => {
    const node = nodes[index++];

    execVisitor[node.type](context, node)
      .catch(err => {
        log(err, process.stderr, chalk.red);
        process.exit(EXIT_STATUS_ERROR);
      })
      .then(execNextNode);
  };

  if (nodes.length) {
    execNextNode();
  }
}

function log (input, stream, color = null) {
  // Convert buffer into string and remove any trailing new lines.
  const text = input.toString().replace(/(\r?\n){1,2}$/, '');

  if (!text.length) {
    return;
  }

  text.split(/\r?\n/).forEach(line => {
    let timeStamp = '';

    if (options.timeStampFormat) {
      timeStamp = `[${chalk.grey(moment().format(options.timeStampFormat))}] `;
    }
    if (options.stripAnsi) {
      line = stripAnsi(line);
    }
    if (color) {
      line = color(line);
    }
    stream.write(`${timeStamp}${line.replace(/\r?\n$/, '')}\n`);
  });
}
