import { EXIT_STATUS_OK } from './status';

export const execVisitor = {
  SimpleCommand (context, node) {
    return context.execute(node.executable, ...node.args)
      .then(result => {
        const { status, signal } = result;

        if (signal || status !== EXIT_STATUS_OK) {
          const id = [node.executable, ...node.args].join(' ');
          let message;

          if (signal) {
            message = `'${id}' was killed with signal ${signal}`;
          } else {
            message = `'${id}' exited with status ${status}`;
          }

          return Promise.reject(new Error(message));
        }

        return Promise.resolve(result);
      });
  },

  Block (context, node) {
    return node.body.reduce(
      (promise, child) => promise.then(() => execVisitor[child.type](context, child)),
      Promise.resolve()
    );
  }
};
