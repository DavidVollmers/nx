import { ExecutorContext, ProjectConfiguration } from '@nx/devkit';

export interface CreateExecutorContextOptions {
  readonly root?: string;
  readonly projectName?: string;
  readonly projectRoot?: string;
  readonly targetName?: string;
  readonly projectConfiguration?: Partial<ProjectConfiguration>;
}

export function createExecutorContext(
  options: CreateExecutorContextOptions = {},
): ExecutorContext {
  const root = options.root ?? '/workspace';
  const projectName = options.projectName ?? 'app';
  const projectRoot = options.projectRoot ?? 'libs/app';

  return {
    root,
    cwd: root,
    isVerbose: false,
    projectName,
    targetName: options.targetName,
    projectGraph: {
      nodes: {},
      dependencies: {},
    },
    nxJsonConfiguration: {},
    projectsConfigurations: {
      version: 2,
      projects: {
        [projectName]: {
          root: projectRoot,
          ...options.projectConfiguration,
        },
      },
    },
  };
}
