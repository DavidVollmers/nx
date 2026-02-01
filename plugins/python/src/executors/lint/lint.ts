import { PromiseExecutor } from '@nx/devkit';
import { LintExecutorSchema } from './schema';
import { dependencyExecutor } from '../../utils/dependencies';

const runExecutor: PromiseExecutor<LintExecutorSchema> = (args, context) => {
  return dependencyExecutor(
    {
      dependencies: ['flake8'],
      commands: {
        flake8: 'flake8 . --color always',
      },
      additionalArgs: args.__unparsed__,
    },
    context,
  );
};

export default runExecutor;
