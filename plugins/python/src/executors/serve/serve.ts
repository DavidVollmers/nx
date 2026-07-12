import { PromiseExecutor } from '@nx/devkit';
import { ServeExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';

const runExecutor: PromiseExecutor<ServeExecutorSchema> = async (
  args,
  context,
) => {
  return uvExecutor(
    {
      command: `run ${args.command}`,
      additionalArgs: args.__unparsed__,
    },
    context,
  );
};

export default runExecutor;
