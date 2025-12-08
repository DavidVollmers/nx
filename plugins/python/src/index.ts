import {
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesV2,
} from 'nx/src/project-graph/plugins';
import { dirname } from 'path';
import { TargetConfiguration } from 'nx/src/config/workspace-json-project-json';
import { joinPathFragments } from '@nx/devkit';
import { PLUGIN_NAME } from './constants';

export interface PythonPluginOptions {
  readonly lintTargetName?: string;
}

export const createNodesV2: CreateNodesV2<PythonPluginOptions> = [
  '**/pyproject.toml',
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context,
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: PythonPluginOptions | undefined,
  context: CreateNodesContextV2,
) {
  const projectRoot = dirname(configFilePath);

  const lintTargetName = options?.lintTargetName ?? 'lint';
  const lintTarget: TargetConfiguration = {
    executor: `${PLUGIN_NAME}:lint`,
    cache: true,
    inputs: [joinPathFragments(projectRoot, '**', '*.py')],
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [lintTargetName]: lintTarget,
        },
      },
    },
  };
}
