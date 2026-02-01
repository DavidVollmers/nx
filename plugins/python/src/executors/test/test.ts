import { PromiseExecutor } from '@nx/devkit';
import { TestExecutorSchema } from './schema';
import { dependencyExecutor } from '../../utils/dependencies';

const runExecutor: PromiseExecutor<TestExecutorSchema> = async (
  args,
  context,
) => {
  return dependencyExecutor(
    {
      dependencies: ['pytest'],
      commands: {
        pytest: 'pytest --color=yes',
      },
      additionalArgs: args.__unparsed__,
    },
    context,
  );
};

export default runExecutor;
