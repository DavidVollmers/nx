import { PromiseExecutor } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import { uvExecutor } from '../../utils/uv';
import { join } from 'path';

const runExecutor: PromiseExecutor<BuildExecutorSchema> = async (
  args,
  context,
) => {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;
  const outDir = join(context.root, 'dist', projectRoot);
  return uvExecutor(
    {
      command: `build --out-dir "${outDir}"`,
      additionalArgs: args.__unparsed__,
    },
    context,
  );
};

export default runExecutor;
