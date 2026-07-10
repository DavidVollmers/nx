import { join } from 'path';
import { createExecutorContext } from '../../testing';
import { TestExecutorSchema } from './schema';

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

import executor from './test';

describe('Test Executor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs pytest via uv when it is declared as a dependency', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      '[dependency-groups]\ndev = ["pytest>=9.0.2"]\n',
    );
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'libs/app',
    });

    const output = await executor({} as TestExecutorSchema, context);

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run pytest --color=yes',
      expect.objectContaining({ cwd: join('/workspace', 'libs/app') }),
    );
  });

  it('forwards unparsed CLI args', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('[project]\ndependencies = ["pytest"]\n');
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await executor(
      { __unparsed__: ['-k', 'my_test'] } as TestExecutorSchema,
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run pytest --color=yes -k my_test',
      expect.anything(),
    );
  });

  it('fails when no pyproject.toml exists at the project root', async () => {
    mockExistsSync.mockReturnValue(false);
    const context = createExecutorContext();

    const output = await executor({} as TestExecutorSchema, context);

    expect(output.success).toBe(false);
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('fails when pytest is not declared in pyproject.toml', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('[project]\ndependencies = ["flake8"]\n');
    const context = createExecutorContext();

    const output = await executor({} as TestExecutorSchema, context);

    expect(output.success).toBe(false);
    expect(mockExecSync).not.toHaveBeenCalled();
  });
});
