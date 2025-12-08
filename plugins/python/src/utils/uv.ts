import { execSync, type ExecSyncOptions } from 'child_process';
import { Tree } from '@nx/devkit';
import { dirname, join } from 'path';
import { DEFAULT_EXEC_OPTIONS } from '../constants';

export function sync(tree: Tree) {
  const execSyncOptions: ExecSyncOptions = {
    ...DEFAULT_EXEC_OPTIONS,
    cwd: tree.root,
  };
  execSync('uv sync --all-packages --all-groups', execSyncOptions);
}

export function addDependency(
  tree: Tree,
  pyprojectPath: string,
  packageName: string,
  groupName?: string,
) {
  if (!tree.exists(pyprojectPath)) {
    throw new Error(`Cannot find ${pyprojectPath}`);
  }
  const execSyncOptions: ExecSyncOptions = {
    ...DEFAULT_EXEC_OPTIONS,
    cwd: join(tree.root, dirname(pyprojectPath)),
  };
  const groupArg = groupName ? ['--group', groupName] : [];
  execSync(
    `uv add ${packageName} ${groupArg.join(' ')} --no-sync`,
    execSyncOptions,
  );
}
