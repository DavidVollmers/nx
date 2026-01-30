import {
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesV2,
} from 'nx/src/project-graph/plugins';
import { dirname, join } from 'path';
import { TargetConfiguration } from 'nx/src/config/workspace-json-project-json';
import { joinPathFragments } from '@nx/devkit';
import { PLUGIN_NAME } from './constants';
import { readdirSync } from 'fs';

export interface PythonPluginOptions {
  readonly lintTargetName?: string;
  readonly testTargetName?: string;
  readonly buildTargetName?: string;
  readonly publishTargetName?: string;
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

  // Do not create a project if package.json or project.json isn't there.
  const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
  if (!siblingFiles.includes('project.json')) return {};

  const lintTargetName = options?.lintTargetName ?? 'lint';
  const lintTarget: TargetConfiguration = {
    executor: `${PLUGIN_NAME}:lint`,
    cache: true,
    inputs: [joinPathFragments('{projectRoot}', '**', '*.py')],
  };

  const testTargetName = options?.testTargetName ?? 'test';
  const testTarget: TargetConfiguration = {
    executor: `${PLUGIN_NAME}:test`,
    cache: true,
    inputs: [
      joinPathFragments('{workspaceRoot}', 'pyproject.toml'),
      joinPathFragments('{projectRoot}', 'pyproject.toml'),
      joinPathFragments('{projectRoot}', '**', '*.py'),
    ],
  };

  const buildTargetName = options?.buildTargetName ?? 'build';
  const buildTarget: TargetConfiguration = {
    executor: `${PLUGIN_NAME}:build`,
    outputs: [joinPathFragments('{projectRoot}', 'dist')],
    dependsOn: [`^${buildTargetName}`],
    cache: true,
    inputs: [
      joinPathFragments('{workspaceRoot}', 'pyproject.toml'),
      joinPathFragments('{projectRoot}', 'pyproject.toml'),
      joinPathFragments('{projectRoot}', '**', '*.py'),
    ],
  };

  const publishTargetName = options?.publishTargetName ?? 'publish';
  const publishTarget: TargetConfiguration = {
    executor: `${PLUGIN_NAME}:publish`,
    dependsOn: [`${buildTargetName}`],
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [lintTargetName]: lintTarget,
          [testTargetName]: testTarget,
          [buildTargetName]: buildTarget,
          [publishTargetName]: publishTarget,
        },
      },
    },
  };
}
