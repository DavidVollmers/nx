import { execSync, type ExecSyncOptions } from 'child_process';
import { Tree } from '@nx/devkit';
import { dirname, join } from 'path';

const defaultExecSyncOptions: ExecSyncOptions = {
  stdio: process.env.NX_GENERATE_QUIET === 'true' ? 'ignore' : 'inherit',
  windowsHide: false,
};

export function sync(tree: Tree) {
  const execSyncOptions: ExecSyncOptions = {
    ...defaultExecSyncOptions,
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
    ...defaultExecSyncOptions,
    cwd: join(tree.root, dirname(pyprojectPath)),
  };
  const groupArg = groupName ? ['--group', groupName] : [];
  execSync(
    `uv add ${packageName} ${groupArg.join(' ')} --no-sync`,
    execSyncOptions,
  );
}
