import { PromiseExecutor } from '@nx/devkit';
import { PublishExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';

const runExecutor: PromiseExecutor<PublishExecutorSchema> = async (
  _,
  context,
) => {
  return uvExecutor(
    {
      command: 'publish',
    },
    context,
  );
};

export default runExecutor;
