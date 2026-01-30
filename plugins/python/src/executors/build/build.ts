import { PromiseExecutor } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';

const runExecutor: PromiseExecutor<BuildExecutorSchema> = async (
  _,
  context,
) => {
  return uvExecutor(
    {
      command: 'build',
    },
    context,
  );
};

export default runExecutor;
