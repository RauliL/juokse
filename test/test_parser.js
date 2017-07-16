const parse = require('../lib/parser').parse;
const should = require('should');

describe('Parser', () => {
  it('should throw exception on syntax error', () => {
    should.throws(() => {
      parse(';foo;');
    });
  });

  it('should be able to parse simple commands', () => {
    const nodes = parse('foo ');

    nodes.should.not.be.empty();
    nodes[0].should.have.enumerable('type');
    nodes[0].type.should.be.equal('SimpleCommand');
    nodes[0].executable.should.be.equal('foo');
    nodes[0].args.should.be.empty();
  });

  it('should be able to parse simple commands with arguments', () => {
    const nodes = parse('foo bar  \t baz');

    nodes.should.not.be.empty();
    nodes[0].should.have.enumerable('type');
    nodes[0].type.should.be.equal('SimpleCommand');
    nodes[0].args.should.have.length(2);
    nodes[0].args[0].should.be.equal('bar');
    nodes[0].args[1].should.be.equal('baz');
  });

  it('should be able to parse commands separated with semicolon', () => {
    const nodes = parse('foo; bar;baz quux');

    nodes.should.not.be.empty();
    nodes[0].should.have.enumerable('type');
    nodes[0].type.should.be.equal('Block');
    nodes[0].body.should.have.length(3);
    nodes[0].body.forEach(node => {
      node.should.have.enumerable('type');
      node.type.should.be.equal('SimpleCommand');
    });
    nodes[0].body[0].executable.should.be.equal('foo');
    nodes[0].body[1].executable.should.be.equal('bar');
    nodes[0].body[2].executable.should.be.equal('baz');
    nodes[0].body[2].args.should.have.length(1);
    nodes[0].body[2].args[0].should.be.equal('quux');
  });

  it('should be able to parse commands separated with newline', () => {
    const nodes = parse('foo\nbar\r\nbaz quux');

    nodes.should.have.length(3);
    nodes.forEach(node => {
      node.should.have.enumerable('type');
      node.type.should.be.equal('SimpleCommand');
    });
  });
});
