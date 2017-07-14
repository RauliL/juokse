export const execVisitor = {
  SimpleCommand (context, node) {
    return context.execute(node.executable, ...node.args);
  }
};
