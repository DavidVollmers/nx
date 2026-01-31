import { PromiseExecutor } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';
import { join } from 'path';

const runExecutor: PromiseExecutor<BuildExecutorSchema> = async (
  _,
  context,
) => {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;
  const outDir = join(context.root, 'dist', projectRoot);
  return uvExecutor(
    {
      command: `build --out-dir "${outDir}"`,
    },
    context,
  );
};

export default runExecutor;
