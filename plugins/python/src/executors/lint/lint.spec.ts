import { join } from 'path';
import { createExecutorContext } from '../../testing';
import { LintExecutorSchema } from './schema';

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

import executor from './lint';

describe('Lint Executor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs flake8 via uv when it is declared as a dependency', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      '[dependency-groups]\ndev = ["flake8>=7.3.0"]\n',
    );
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'libs/app',
    });

    const output = await executor({} as LintExecutorSchema, context);

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run flake8 . --color always',
      expect.objectContaining({ cwd: join('/workspace', 'libs/app') }),
    );
  });

  it('forwards unparsed CLI args', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('[project]\ndependencies = ["flake8"]\n');
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await executor(
      { __unparsed__: ['--max-line-length=100'] } as LintExecutorSchema,
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run flake8 . --color always --max-line-length=100',
      expect.anything(),
    );
  });

  it('fails when no pyproject.toml exists at the project root', async () => {
    mockExistsSync.mockReturnValue(false);
    const context = createExecutorContext();

    const output = await executor({} as LintExecutorSchema, context);

    expect(output.success).toBe(false);
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('fails when flake8 is not declared in pyproject.toml', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('[project]\ndependencies = ["pytest"]\n');
    const context = createExecutorContext();

    const output = await executor({} as LintExecutorSchema, context);

    expect(output.success).toBe(false);
    expect(mockExecSync).not.toHaveBeenCalled();
  });
});
