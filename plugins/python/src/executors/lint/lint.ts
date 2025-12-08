import { ExecutorContext, PromiseExecutor } from '@nx/devkit';
import { LintExecutorSchema } from './schema';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import TOML from 'smol-toml';
import { doesDependencyExist } from '../../utils/dependencies';

const runExecutor: PromiseExecutor<LintExecutorSchema> = async (
  options,
  context: ExecutorContext,
) => {
  const projectTomlPath = join(context.root, 'pyproject.toml');
  if (!existsSync(projectTomlPath)) {
    console.error(`Error: No pyproject.toml found at ${projectTomlPath}.`);
    return {
      success: false,
    };
  }

  const content = readFileSync(projectTomlPath, 'utf-8');
  const toml = TOML.parse(content);

  if (!doesDependencyExist(toml, 'flake8')) {
    console.error(
      `Error: flake8 is not listed as a dependency in ${projectTomlPath}.`,
    );
    return {
      success: false,
    };
  }

  return {
    success: true,
  };
};

export default runExecutor;
