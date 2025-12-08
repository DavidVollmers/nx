import { ExecutorContext, PromiseExecutor } from '@nx/devkit';
import { LintExecutorSchema } from './schema';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import TOML from 'smol-toml';
import { doesDependencyExist } from '../../utils/dependencies';
import { execSync, type ExecSyncOptions } from 'child_process';
import { DEFAULT_EXEC_OPTIONS } from '../../constants';

const runExecutor: PromiseExecutor<LintExecutorSchema> = async (
  _,
  context: ExecutorContext,
) => {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;

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

  const execSyncOptions: ExecSyncOptions = {
    ...DEFAULT_EXEC_OPTIONS,
    cwd: join(context.root, projectRoot),
  };

  const command = 'uv run flake8 . --color always';
  try {
    execSync(command, execSyncOptions);
  } catch (error) {
    if (!error.message.includes(command)) {
      console.error('Error:', error.message);
    }
    return {
      success: false,
    };
  }

  return {
    success: true,
  };
};

export default runExecutor;
