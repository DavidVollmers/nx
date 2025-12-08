import { ExecSyncOptions } from 'child_process';

export const PRIVATE_CLASSIFIER = 'Private :: Do Not Upload';

export const PLUGIN_NAME = '@dev-tales/nx-python';

export const DEFAULT_EXEC_OPTIONS: ExecSyncOptions = {
  stdio: process.env.NX_GENERATE_QUIET === 'true' ? 'ignore' : 'inherit',
  windowsHide: false,
};
