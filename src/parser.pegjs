{
  // Based on Stack Overflow answer https://stackoverflow.com/a/10708913
  var indentHistory = [0];

  function start (first, tail) {
    var done = [first[1]];

    for (var i = 0; i < tail.length; ++i) {
      done = done.concat(tail[i][1][0]);
      done.push(tail[i][1][1]);
    }

    return done;
  }

  function indent (s) {
    var depth = s.length;

    if (depth === indentHistory[0]) {
      return [];
    }

    if (depth > indentHistory[0]) {
      indentHistory.unshift(depth);

      return ['INDENT'];
    }

    var dents = [];

    while (depth < indentHistory[0]) {
      indentHistory.shift();
      dents.push('DEDENT');
    }

    if (depth !== indentHistory[0]) {
      dents.push('BADDENT');
    }

    return dents;
  }
}

Start
  = first:Line tail:(LineTerminator Line)* LineTerminator? {
    return start(first, tail);
  }

WhiteSpace
  = [ \t]+ ('\\' LineTerminator+ [ \t]*)?

LineTerminator
  = '\n'
  / '\r\n'
  / '\r'
  / '\u2028'
  / '\u2029'

Word
  = id:[^ \t\r\n\u2028\u2029;:\\]+ WhiteSpace? {
      return id.join('');
    }

Line
  = depth:Indentation command:Command {
      return [depth, command];
    }

Indentation
  = s:[ \t]* {
      return indent(s);
    }

Command
  = SimpleCommandList
  / SimpleCommand

SimpleCommandList
  = initial:SimpleCommand additional:(';' WhiteSpace? SimpleCommand)+ {
    return {
      type: 'Block',
      body: [initial].concat(additional.map(ary => ary[2]))
    };
  }

// TODO: Add support for I/O redirection and '&&' and '||' operators.
SimpleCommand
  = executable:Word args:Word* {
    return {
      type: 'SimpleCommand',
      executable: executable,
      args: args
    };
  }
