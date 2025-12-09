import { PromiseExecutor } from '@nx/devkit';
import { TestExecutorSchema } from './schema';
import { dependencyExecutor } from '../../utils/dependencies';

const runExecutor: PromiseExecutor<TestExecutorSchema> = async (_, context) => {
  return dependencyExecutor(
    {
      dependencies: ['pytest'],
      commands: {
        pytest: 'pytest --color=yes',
      },
    },
    context,
  );
};

export default runExecutor;
