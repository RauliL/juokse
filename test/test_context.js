'use strict';

var Context = require('../lib/context').default;

var os = require('os');
var path = require('path');
var should = require('should');

describe('Context', function () {
  describe('#cwd', function () {
    it('should return current working directory by default', function () {
      should.strictEqual(new Context().cwd, process.cwd());
    });

    it('should allow changing of current working directory', function () {
      var context = new Context();
      var libDir = path.join(process.cwd(), 'lib');
      var rootDir = (os.platform === 'win32') ? process.cwd().split(path.sep)[0] : '/';

      context.cwd = libDir;
      should.strictEqual(context.cwd, libDir);

      context.cwd = rootDir;
      should.strictEqual(context.cwd, rootDir);
    });

    it('should throw error when trying to set non-existing directory as cwd', function () {
      should.throws(function () {
        new Context().cwd = path.join(process.cwd(), 'non-existent');
      });
    });
  });

  describe('#path', function () {
    it('should return empty path by default', function () {
      (new Context().path).should.be.empty();
    });

    it('should allow array as new path', function () {
      var context = new Context();

      context.path = [];
      should.strictEqual(context.environment.PATH, '');

      context.path = ['foo'];
      should.strictEqual(context.environment.PATH, 'foo');

      context.path = ['foo', 'bar'];
      should.strictEqual(context.environment.PATH, 'foo' + path.delimiter + 'bar');
    });

    it('should allow string as new path', function () {
      var context = new Context();

      context.path = '';
      should.strictEqual(context.environment.PATH, '');

      context.path = 'foo';
      should.strictEqual(context.environment.PATH, 'foo');

      context.path = 'foo' + path.delimiter + 'bar';
      should.strictEqual(context.environment.PATH, 'foo' + path.delimiter + 'bar');
    });
  });

  describe('#resolveExecutable()', function () {
    it('should resolve no executables by default', function () {
      should.not.exist(new Context().resolveExecutable('ls'));
    });

    it('should resolve executables', function () {
      var context = new Context();
      var binDir = path.join(process.cwd(), 'bin');

      context.path = binDir;
      should.strictEqual(context.resolveExecutable('juokse'), path.join(binDir, 'juokse'));
    });
  });

  describe('#expand()', function () {
    var context = new Context();

    it('should not expand non-wildcards', function () {
      var output = [];

      context.expand('foo', output);
      should.strictEqual(output.length, 1);
      should.strictEqual(output[0], 'foo');
    });

    it('should expand wildcards', function () {
      var output = [];

      context.expand('./lib/c*.js', output);
      should.exist(output);
      should.ok(output, output.indexOf('./lib/cli.js') >= 0);
      should.ok(output, output.indexOf('./lib/context.js') >= 0);
    });

    it('should throw error for non-matching wildcard', function () {
      should.throws(function () {
        context.expand('x*x*x', []);
      });
    });
  });

  describe('#execute()', function () {
    it('should reject non-existing executables', function () {
      new Context().execute('non-existent').should.be.rejected();
    });
  });
});
