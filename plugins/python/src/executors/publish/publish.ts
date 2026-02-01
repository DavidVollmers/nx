import { PromiseExecutor } from '@nx/devkit';
import { PublishExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';
import { join } from 'path';

const runExecutor: PromiseExecutor<PublishExecutorSchema> = async (
  args,
  context,
) => {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;
  const publishTarget = join(context.root, 'dist', projectRoot, '*.whl');
  return uvExecutor(
    {
      command: `publish "${publishTarget}"`,
      additionalArgs: args.__unparsed__,
    },
    context,
  );
};

export default runExecutor;
