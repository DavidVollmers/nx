import { join } from 'path';
import { createExecutorContext } from '../testing';

const { mockExecSync, mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));
vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  execSync: mockExecSync,
}));
vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

import { dependencyExecutor, doesDependencyExist } from './dependencies';

describe('doesDependencyExist', () => {
  it('matches an exact name in project.dependencies', () => {
    expect(
      doesDependencyExist({ project: { dependencies: ['flake8'] } }, 'flake8'),
    ).toBe(true);
  });

  it('matches a versioned specifier via the regex, case-insensitively', () => {
    expect(
      doesDependencyExist(
        { project: { dependencies: ['flake8>=7.3.0'] } },
        'FLAKE8',
      ),
    ).toBe(true);
  });

  it('does not match a prefix-colliding dependency name', () => {
    expect(
      doesDependencyExist(
        { project: { dependencies: ['flake8-docstrings'] } },
        'flake8',
      ),
    ).toBe(false);
  });

  it('matches inside a dependency-groups entry', () => {
    expect(
      doesDependencyExist(
        { 'dependency-groups': { dev: ['pytest==8.0'] } },
        'pytest',
      ),
    ).toBe(true);
  });

  it('returns false when neither dependencies nor groups are present', () => {
    expect(doesDependencyExist({}, 'flake8')).toBe(false);
  });

  it('returns false when project.dependencies is empty and there are no groups', () => {
    expect(
      doesDependencyExist({ project: { dependencies: [] } }, 'flake8'),
    ).toBe(false);
  });
});

describe('dependencyExecutor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails when pyproject.toml does not exist at the project root', async () => {
    mockExistsSync.mockReturnValue(false);
    const context = createExecutorContext({ root: '/workspace' });

    const output = await dependencyExecutor(
      { dependencies: ['flake8'], commands: { flake8: 'flake8 .' } },
      context,
    );

    expect(output.success).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(join('/workspace', 'pyproject.toml')),
    );
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('fails when none of the dependencies are listed', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('[project]\ndependencies = ["pytest"]\n');
    const context = createExecutorContext();

    const output = await dependencyExecutor(
      { dependencies: ['flake8'], commands: { flake8: 'flake8 .' } },
      context,
    );

    expect(output.success).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('flake8'),
    );
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('delegates to uv run with the command for the matched dependency', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('[project]\ndependencies = ["pytest"]\n');
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'libs/app',
    });

    const output = await dependencyExecutor(
      {
        dependencies: ['flake8', 'pytest'],
        commands: { flake8: 'flake8 .', pytest: 'pytest --color=yes' },
      },
      context,
    );

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run pytest --color=yes',
      expect.objectContaining({ cwd: join('/workspace', 'libs/app') }),
    );
  });

  it('uses the first matching dependency, not the last, when multiple are declared', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      '[project]\ndependencies = ["flake8", "pytest"]\n',
    );
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await dependencyExecutor(
      {
        dependencies: ['flake8', 'pytest'],
        commands: { flake8: 'flake8 .', pytest: 'pytest --color=yes' },
      },
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run flake8 .',
      expect.anything(),
    );
  });
});
