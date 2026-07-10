import { joinPathFragments } from '@nx/devkit';
import type { CreateNodesContext } from 'nx/src/project-graph/plugins';

const { mockReaddirSync } = vi.hoisted(() => ({ mockReaddirSync: vi.fn() }));
vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  readdirSync: mockReaddirSync,
}));

import { createNodes, PythonPluginOptions } from './index';

const [pattern, createNodesFn] = createNodes;

function createContext(): CreateNodesContext {
  return {
    workspaceRoot: '/workspace',
    nxJsonConfiguration: {},
  };
}

describe('createNodes pattern', () => {
  it('matches pyproject.toml files anywhere in the workspace', () => {
    expect(pattern).toBe('**/pyproject.toml');
  });
});

describe('createNodes', () => {
  beforeEach(() => {
    mockReaddirSync.mockReset();
  });

  it('creates no project when there is no sibling project.json', async () => {
    mockReaddirSync.mockReturnValue(['pyproject.toml']);

    const result = await createNodesFn(
      ['libs/app/pyproject.toml'],
      undefined,
      createContext(),
    );

    expect(result).toEqual([['libs/app/pyproject.toml', {}]]);
  });

  it('creates a project with the four default targets when project.json is present', async () => {
    mockReaddirSync.mockReturnValue(['pyproject.toml', 'project.json']);

    const result = await createNodesFn(
      ['libs/app/pyproject.toml'],
      undefined,
      createContext(),
    );

    const [, value] = result[0];
    const project = value.projects['libs/app'];

    expect(Object.keys(project.targets)).toEqual([
      'lint',
      'test',
      'build',
      'publish',
    ]);
    expect(project.targets.lint.executor).toBe('@dev-tales/nx-python:lint');
    expect(project.targets.test.executor).toBe('@dev-tales/nx-python:test');
    expect(project.targets.build.executor).toBe('@dev-tales/nx-python:build');
    expect(project.targets.publish.executor).toBe(
      '@dev-tales/nx-python:publish',
    );
    expect(project.targets.build.dependsOn).toEqual(['^build']);
    expect(project.targets.publish.dependsOn).toEqual(['build']);
    expect(project.targets.build.outputs).toEqual([
      joinPathFragments('{workspaceRoot}', 'dist', '{projectRoot}'),
    ]);
    expect(project.implicitDependencies).toEqual([]);
    expect(project.release).toEqual({ version: {} });
  });

  it('threads custom target names through the dependsOn wiring', async () => {
    mockReaddirSync.mockReturnValue(['pyproject.toml', 'project.json']);
    const options: PythonPluginOptions = {
      lintTargetName: 'my-lint',
      buildTargetName: 'compile',
      publishTargetName: 'ship',
    };

    const result = await createNodesFn(
      ['libs/app/pyproject.toml'],
      options,
      createContext(),
    );

    const [, value] = result[0];
    const project = value.projects['libs/app'];

    expect(Object.keys(project.targets)).toEqual([
      'my-lint',
      'test',
      'compile',
      'ship',
    ]);
    expect(project.targets.compile.dependsOn).toEqual(['^compile']);
    expect(project.targets.ship.dependsOn).toEqual(['compile']);
  });

  it('only surfaces projects for config files with a sibling project.json', async () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.endsWith('with-project')
        ? ['pyproject.toml', 'project.json']
        : ['pyproject.toml'],
    );

    const result = await createNodesFn(
      [
        'libs/with-project/pyproject.toml',
        'libs/without-project/pyproject.toml',
      ],
      undefined,
      createContext(),
    );

    const byFile = Object.fromEntries(result);
    expect(byFile['libs/with-project/pyproject.toml'].projects).toHaveProperty(
      'libs/with-project',
    );
    expect(byFile['libs/without-project/pyproject.toml']).toEqual({});
  });
});
