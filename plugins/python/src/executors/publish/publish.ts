import { PromiseExecutor } from '@nx/devkit';
import { PublishExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';
import { join } from 'path';

const runExecutor: PromiseExecutor<PublishExecutorSchema> = async (
  _,
  context,
) => {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;
  const publishTarget = join(context.root, 'dist', projectRoot, '*.whl');
  return uvExecutor(
    {
      command: `publish "${publishTarget}"`,
    },
    context,
  );
};

export default runExecutor;
