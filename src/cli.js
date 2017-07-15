import Context from './context';

import chalk from 'chalk';
import fs from 'fs';
import moment from 'moment';
import path from 'path';

import { parse } from './parser';
import { execVisitor } from './visitor';

export function run () {
  const context = createContext();
  const program = require('commander');

  program
    .version('0.0.2')
    .usage('[options] <file> [arguments]')
    .parse(process.argv);

  // TODO: Add support for reading input from stdin.
  if (!program.args.length || program.args[0] === '-') {
    process.stderr.write(`${path.basename(process.argv[1])}: Missing filename\n`);
    process.exit(1);
  }

  compileFromFile(context, program.args[0]);
}

function createContext () {
  const instance = new Context();

  // Copy environment variables from system into context.
  Object.assign(instance.environment, process.env);

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
      .catch(err => { throw err; })
      .then(({ status }) => {
        if (status !== 0) {
          log(`Process exited with status ${status}`, process.stdout, chalk.red);
          return;
        }
        execNextNode();
      });
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
    const timeStamp = `[${chalk.grey(moment().format('HH:mm:ss'))}]`;

    if (color) {
      line = color(line);
    }
    stream.write(`${timeStamp} ${line.replace(/\r?\n$/, '')}\n`);
  });
}
