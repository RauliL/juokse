const Context = require('../lib/context').default;

const os = require('os');
const path = require('path');
const should = require('should');

describe('Context', () => {
  describe('#cwd', () => {
    it('should return current working directory by default', () => {
      should.strictEqual(new Context().cwd, process.cwd());
    });

    it('should allow changing of current working directory', () => {
      const context = new Context();
      const libDir = path.join(process.cwd(), 'lib');
      const rootDir = (os.platform === 'win32') ? process.cwd().split(path.sep)[0] : '/';

      context.cwd = libDir;
      should.strictEqual(context.cwd, libDir);

      context.cwd = rootDir;
      should.strictEqual(context.cwd, rootDir);
    });

    it('should throw error when trying to set non-existing directory as cwd', () => {
      should.throws(() => {
        new Context().cwd = path.join(process.cwd(), 'non-existent');
      });
    });
  });

  describe('#path', () => {
    it('should return empty path by default', () => {
      (new Context().path).should.be.empty();
    });

    it('should allow array as new path', () => {
      const context = new Context();

      context.path = [];
      should.strictEqual(context.environment.PATH, '');

      context.path = ['foo'];
      should.strictEqual(context.environment.PATH, 'foo');

      context.path = ['foo', 'bar'];
      should.strictEqual(context.environment.PATH, 'foo' + path.delimiter + 'bar');
    });

    it('should allow string as new path', () => {
      const context = new Context();

      context.path = '';
      should.strictEqual(context.environment.PATH, '');

      context.path = 'foo';
      should.strictEqual(context.environment.PATH, 'foo');

      context.path = 'foo' + path.delimiter + 'bar';
      should.strictEqual(context.environment.PATH, 'foo' + path.delimiter + 'bar');
    });
  });

  describe('#resolveExecutable()', () => {
    it('should resolve no executables by default', () => {
      should.not.exist(new Context().resolveExecutable('ls'));
    });

    it('should resolve executables', () => {
      const context = new Context();
      const binDir = path.join(process.cwd(), 'bin');

      context.path = binDir;
      should.strictEqual(context.resolveExecutable('juokse'), path.join(binDir, 'juokse'));
    });
  });

  describe('#expand()', () => {
    const context = new Context();

    it('should not expand non-wildcards', () => {
      const output = [];

      context.expand('foo', output);
      should.strictEqual(output.length, 1);
      should.strictEqual(output[0], 'foo');
    });

    it('should expand wildcards', () => {
      const output = [];

      context.expand('./lib/c*.js', output);
      should.exist(output);
      should.ok(output, output.indexOf('./lib/cli.js') >= 0);
      should.ok(output, output.indexOf('./lib/context.js') >= 0);
    });

    it('should throw error for non-matching wildcard', () => {
      should.throws(() => {
        context.expand('x*x*x', []);
      });
    });
  });

  describe('#execute()', () => {
    it('should reject non-existing executables', () => {
      new Context().execute('non-existent').should.be.rejected();
    });
  });
});
