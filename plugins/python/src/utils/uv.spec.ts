import { join } from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { DEFAULT_EXEC_OPTIONS } from '../constants';
import { createExecutorContext } from '../testing';

const { mockExecSync } = vi.hoisted(() => ({ mockExecSync: vi.fn() }));
vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  execSync: mockExecSync,
}));

import { addDependency, sync, uvExecutor } from './uv';

describe('sync', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    mockExecSync.mockReset();
  });

  it('runs uv sync across all packages and groups', () => {
    sync(tree);

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv sync --all-packages --all-groups',
      expect.objectContaining({
        cwd: tree.root,
        stdio: DEFAULT_EXEC_OPTIONS.stdio,
        windowsHide: DEFAULT_EXEC_OPTIONS.windowsHide,
      }),
    );
  });
});

describe('addDependency', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    mockExecSync.mockReset();
  });

  it('throws when the pyproject.toml does not exist in the tree', () => {
    expect(() =>
      addDependency(tree, 'libs/app/pyproject.toml', 'flake8'),
    ).toThrow('Cannot find libs/app/pyproject.toml');
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('adds a dependency without a group', () => {
    tree.write('libs/app/pyproject.toml', '[project]\nname = "app"\n');

    addDependency(tree, 'libs/app/pyproject.toml', 'flake8');

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv add flake8  --no-sync',
      expect.objectContaining({ cwd: join(tree.root, 'libs/app') }),
    );
  });

  it('adds a dependency to a specific group', () => {
    tree.write('libs/app/pyproject.toml', '[project]\nname = "app"\n');

    addDependency(tree, 'libs/app/pyproject.toml', 'flake8', 'dev');

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv add flake8 --group dev --no-sync',
      expect.objectContaining({ cwd: join(tree.root, 'libs/app') }),
    );
  });

  it('resolves cwd relative to the pyproject.toml directory', () => {
    tree.write('pyproject.toml', '[project]\nname = "root"\n');

    addDependency(tree, 'pyproject.toml', 'flake8');

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cwd: join(tree.root, '.') }),
    );
  });
});

describe('uvExecutor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success: true and runs the given command', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'libs/app',
    });

    const output = await uvExecutor({ command: 'build' }, context);

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      'uv build',
      expect.objectContaining({ cwd: join('/workspace', 'libs/app') }),
    );
  });

  it('omits any trailing whitespace when additionalArgs is undefined', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await uvExecutor({ command: 'build' }, context);

    expect(mockExecSync).toHaveBeenCalledWith('uv build', expect.anything());
  });

  it('appends additionalArgs, space-joined, when present', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await uvExecutor(
      { command: 'build', additionalArgs: ['--wheel', '--sdist'] },
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv build --wheel --sdist',
      expect.anything(),
    );
  });

  it('resolves cwd from the current project in the context', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/root-a',
      projectName: 'a',
      projectRoot: 'libs/a',
    });

    await uvExecutor({ command: 'build' }, context);

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cwd: join('/root-a', 'libs/a') }),
    );
  });

  it('suppresses console.error when the thrown message already contains the command', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('uv: command not found: build');
    });
    const context = createExecutorContext();

    const output = await uvExecutor({ command: 'build' }, context);

    expect(output.success).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs console.error when the thrown message does not contain the command', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const context = createExecutorContext();

    const output = await uvExecutor({ command: 'build' }, context);

    expect(output.success).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Error:', 'ENOENT');
  });
});
