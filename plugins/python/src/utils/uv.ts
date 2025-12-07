import { execSync, type ExecSyncOptions } from 'child_process';
import { Tree } from '@nx/devkit';

export function sync(tree: Tree) {
  const execSyncOptions: ExecSyncOptions = {
    cwd: tree.root,
    stdio: process.env.NX_GENERATE_QUIET === 'true' ? 'ignore' : 'inherit',
    windowsHide: false,
  };
  execSync('uv sync --all-packages --all-groups', execSyncOptions);
}
